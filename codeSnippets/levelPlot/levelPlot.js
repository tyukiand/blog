var levelPlot = (function() {
  // hide everything in a module
  var levelPlotModule = {};

  /* ###########################################################################
                            Load balancer
    ##########################################################################*/

  /**
   * A rudimentary load balancer that 
   * coordinates the work of multiple web-workers
   */
  function LoadBalancer(
    workerSourceFile, 
    numWorkers, 
    onJobDone
  ) {
    var workers = new Array();
    var isOccupied = new Array();
    var todos = new Array();
  
    // create the workers
    for (var i = 0; i < numWorkers; i++) { (function(i) {
      if (window.Worker) {
        var w = new Worker(workerSourceFile);
        w.addEventListener("message", function(msg) {
          onJobDone(msg.data);
          isOccupied[i] = false;
          tryAssignJob(i);
        });
        workers.push(w);
        isOccupied.push(false);
      } else {
         throw "Error: no web-worker support";
      }
    })(i);}
      
    // local helper function for assigning new jobs to workers
    function tryAssignJob(idx) {
      if (todos.length > 0 && !isOccupied[idx]) {
        var job = todos.shift();
        workers[idx].postMessage(job);
        isOccupied[idx] = true;
      }
    }
  
    /** Empties the job queue and resets all internal counters */
    this.reset = function () {
      todos = new Array();
    };
  
    /** Retains only the jobs that fulfill the predicate */
    this.filterJobs = function (predicate) {
      var filteredTodos = [];
      for (var i in todos) {
        var job = todos[i];
        if (predicate(job)) {
          filteredTodos.push(job);
        }
      }
      todos = filteredTodos;
    };

    /** Adds a job to the queue */
    this.addJob = function (job) {
      todos.push(job);
    };
  
    /** Makes sure every worker has something to do */
    this.assignJobs = function () {
      for (var i = 0; i < numWorkers; i++) {
        tryAssignJob(i);
      }
    };
  }

  /* ###########################################################################
                           Quasi-priority queue
    ##########################################################################*/

  /**
   * A quasi-priority queue that sorts 
   * elements into finitely many bins.
   */
  function QuasiPriorityQueue(
    maxPriority,
    minPriority,
    numBins
  ) {
    this.bins = new Array(numBins);
    this.size = 0;
  
    // where one should start looking if one wants to dequeue
    var lookingAtBin = numBins - 1; // highest priority
    var prioToBinFactor = (numBins - 1) / (maxPriority - minPriority);
  
    // initialization
    for (var b = 0; b < numBins; b++) {
      this.bins[b] = []; 
    }
  
    /** Enqueues an element with specified priority */
    this.enqueue = function(element, priority) {
      var approxBinIdx = 
        Math.floor((priority - minPriority) * prioToBinFactor);
      var binIdx = 
        Math.min(Math.max(approxBinIdx, 0), numBins - 1);
      var bin = this.bins[binIdx];
      bin.push(element);
      this.size++;
  
      // move the `lookingAt`-index up if necessary
      if (lookingAtBin < binIdx) {
        lookingAtBin = binIdx;
      }
    }
  
    /** Returns true if this map is empty */
    this.isEmpty = function() {
      return this.size == 0;
    }
  
    /** Dequeues an element from the topmost non-empty bin */
    this.dequeue = function() {
      if (this.isEmpty()) {
        throw "Cannot dequeue element: queue is empty."
      } else {
        while (this.bins[lookingAtBin].length == 0) {
          lookingAtBin--;
        }
        var bin = this.bins[lookingAtBin];
        var res = bin.shift();
        this.size--;
        return res;
      }
    }
  
    /** Removes all entries from this queue */
    this.clear = function() {
      for (var i = 0; i < numBins; i++) {
        this.bins[i] = [];
        this.binSizes[i] = 0;
        lookingAtBin = numBins - 1;
        this.size = 0;
      }
    }
  
    /** executes `f` on every entry */
    this.foreach = function(f) {
      for (var b = 0; b < numBins; b++) {
        for (var i = 0; i < this.bins[b].length; i++) {
          f(this.bins[b][i]);
        }
      }
    }
  }

  /* ###########################################################################
                            Utils: equality
  ##########################################################################*/

  /**
   * Flat object equality test.
   * Works only for objects that look like 
   * `{k1:v1, k2:v2, ..., kN: vN}`, where
   * `k1` ... `kN` are some keys, and `v1` ... `vN` are 
   * primitive values.
   */
  function flatEquals(a, b) {
    var aNumProperties = 0;
    var bNumProperties = 0;
    for (var i in b) bNumProperties++;
    for (i in a) {
      aNumProperties++;
      if (a[i] !== b[i]) return false;
    }
    if (aNumProperties != bNumProperties) return false;
    return true;
  }

  /* ###########################################################################
                           Function patches 
    ##########################################################################*/

  /**
   * Computes total variation of a discrete function on a cycle,
   * that is, computes sum of distances between all entries `values[i]` and
   * `values[i+1]`, plus the distance between first and last entry.
   *
   * Expects an array of double values of input.
   * Returns a double. 
   */
  function cyclicTotalVariation(values) {
    var res = 0.0;
    for (var i = 1; i < values.length; i++) {
      res += Math.abs(values[i-1] - values[i]);
    }
    return res + Math.abs(values[0] - values[values.length - 1]);
  }
  
  /**
   * Rectangle with sides parallel to the x and y axis.
   */
  function Rect(left, right, bottom, top) {
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
    this.width = right - left;
    this.height = top - bottom;
    this.area = this.width * this.height;
  }
  
  /** 
   * Rectangular subset of the plotted area,
   * with screen coordinates, world coordinates, and
   * function values evaluated on the vertices.
   */
  function FunctionPatch(
    worldRect,
    screnRect, // [sic] It's intentionally 'scren', so it has same length...
    values     // tr, tl, bl, br
  ) {
    this.worldRect = worldRect;
    this.screnRect = screnRect;
    this.values = values;
  
    /** 
     * Splits this rectangle into two smaller 
     * rectangles. The values on the four new vertices are 
     * initialized using the function `f`. The
     * function `f` is expected to take two doubles and return a 
     * single double.
     */
    // this.subdivide = 
  }

  FunctionPatch.prototype.subdivide = function(f) {
    var screnRect = this.screnRect;
    var worldRect = this.worldRect;
    var values = this.values;
    if (screnRect.width > screnRect.height) {
      // split rectangle horizontally into [ A | B ]
      var dx = worldRect.width / (screnRect.width - 1);

      var aScrenWidth = Math.floor(screnRect.width / 2);
      var bScrenWidth = screnRect.width - aScrenWidth;
      var aScrenRight = screnRect.left + aScrenWidth;
      var bScrenLeft = screnRect.right - bScrenWidth;

      var aWorldWidth = (aScrenWidth - 1) * dx;
      var bWorldWidth = (bScrenWidth - 1) * dx;
      var aWorldRight = worldRect.left + aWorldWidth;
      var bWorldLeft = worldRect.right - bWorldWidth;

      var aTopRight = f(aWorldRight, worldRect.top);
      var aBottomRight = f(aWorldRight, worldRect.bottom);

      var bTopLeft = f(bWorldLeft, worldRect.top);
      var bBottomLeft = f(bWorldLeft, worldRect.bottom);

      var a = new FunctionPatch(
        new Rect(worldRect.left, aWorldRight, worldRect.bottom, worldRect.top),
        new Rect(screnRect.left, aScrenRight, screnRect.bottom, screnRect.top),
        [aTopRight, values[1], values[2], aBottomRight]
      );
      
      var b = new FunctionPatch(
        new Rect(bWorldLeft, worldRect.right, worldRect.bottom, worldRect.top),
        new Rect(bScrenLeft, screnRect.right, screnRect.bottom, screnRect.top),
        [values[0], bTopLeft, bBottomLeft, values[3]]
      );

      return [a, b];
    } else {
      // split vertically, A on bottom, B on top
      var dy = worldRect.height / (screnRect.height - 1);

      var aScrenHeight = Math.floor(screnRect.height / 2);
      var bScrenHeight = screnRect.height - aScrenHeight;
      var aScrenTop = screnRect.bottom + aScrenHeight;
      var bScrenBottom = screnRect.top - bScrenHeight;

      var aWorldHeight = (aScrenHeight - 1) * dy;
      var bWorldHeight = (bScrenHeight - 1) * dy;
      var aWorldTop = worldRect.bottom + aWorldHeight;
      var bWorldBottom = worldRect.top - bWorldHeight;

      var aTopRight = f(worldRect.right, aWorldTop);
      var aTopLeft = f(worldRect.left, aWorldTop);

      var bBottomLeft = f(worldRect.left, bWorldBottom);
      var bBottomRight = f(worldRect.right, bWorldBottom);

      var a = new FunctionPatch(
        new Rect(worldRect.left, worldRect.right, worldRect.bottom, aWorldTop),
        new Rect(screnRect.left, screnRect.right, screnRect.bottom, aScrenTop),
        [aTopRight, aTopLeft, values[2], values[3]]
      );
      
      var b = new FunctionPatch(
        new Rect(worldRect.left, worldRect.right, bWorldBottom, worldRect.top),
        new Rect(screnRect.left, screnRect.right, bScrenBottom, screnRect.top),
        [values[0], values[1], bBottomLeft, bBottomRight]
      );
    
      return [a, b];
    }
  };

  /* ###########################################################################
        Two simple but useful methods to measure how much a function varies
     ######################################################################## */
  
  /**
   * Computes total variation of a discrete function on a cycle,
   * that is, computes sum of distances between all entries `values[i]` and
   * `values[i+1]`, plus the distance between first and last entry.
   *
   * Expects an array of double values of input.
   * Returns a double. 
   */
  levelPlotModule.realCyclicVariation = function(values) {
    var res = 0.0;
    for (var i = 1; i < values.length; i++) {
      res += Math.abs(values[i-1] - values[i]);
    }
    return res + Math.abs(values[0] - values[values.length - 1]);
  };

  /**
   * Computes kind of L1-total-variation for cyclical array of complex
   * numbers. Assumes that values have members `im` and `re`.
   */
  levelPlotModule.complexCyclicVariation = function(values) {
    var res = 0.0;
    for (var i = 1; i < values.length; i++) {
      var prev = values[i-1];
      var curr = values[i];
      res += (Math.abs(prev.re - curr.re) + Math.abs(prev.im - curr.im));
    }
    var prev = values[i];
    var curr = values[0];
    res += (Math.abs(prev.re - curr.re) + Math.abs(prev.im - curr.im));

    return res;
  }

  /* ###########################################################################
                              `Plot` constructor 
     #########################################################################*/

  /**
   * Constructor for a plotter bound to a concrete canvas.
   *
   * @param f function to evaluate
   * @
   */
  levelPlotModule.Plot = function(
    funcFactory /* param -> (x, y) -> result */,     // what to compute
    webWorkerSrc,
    minX,           // where to compute
    maxX,
    minY,
    maxY,
    variationMeasure, // how to decide what's interesting and what's not
    approxMinPriority,
    approxMaxPriority,
    canvasElemId,   // where to paint,
    paintingSettings // how to paint (unspecified, you can pass anything)
  ) {
    
    // bunch of back-buffers, initially contains only the visible canvas
    var backBuffers = (function() {
      var canvasElem = document.getElementById(canvasElemId);
      var canvasCtx = canvasElem.getContext('2d');

      return {
        visible : {
          canvas: canvasElem,
          context: canvasCtx,
          param: {},
          numTodos: 0
        }
      };
    })();

    function onJobDone(responseData) {
      var screnRect = responseData.screnRect;

      // convert the pixel values from Uint8Clamped to ImageData
      var imgData = 
        new ImageData(responseData.pixels, screnRect.width, screnRect.height);

      var id = responseData.id;
      var bb = backBuffers[id];

      // write the pixels to the back-buffer
      if(bb) {
        // the `if` is necessary so that results of outdated jobs are ignored
        if (flatEquals(responseData.param, bb.param)) {
          bb.context.putImageData(
            imgData, screnRect.left, screnRect.bottom
          );
          bb.numTodos--;
        } 
      } else {
        throw (
          "Error: received unexpected message with ID = " + responseData.id
        );
      }
    }
    
    /**
     * Makes sure that a buffer for given `id` exists, 
     * and that it has the size of `visible` buffer.
     */
    function ensureBufferExists(id) {
      var visibleCanvas = backBuffers.visible.canvas;
      var dummyCanvas = document.createElement('canvas');
      dummyCanvas.width =  visibleCanvas.width;
      dummyCanvas.height = visibleCanvas.height;
      var ctx = dummyCanvas.getContext('2d');
      
      if (!backBuffers[id]) {
        var bb = {
          canvas: dummyCanvas,
          context: ctx,
          numTodos: 0,
          param: {}
        };
        backBuffers[id] = bb;
      } else {
        var bb = backBuffers[id];
        if (bb.canvas.width != visibleCanvas.width ||
            bb.canvas.height != visibleCanvas.height) {
          delete backBuffers[id];
          ensureBufferExists(id);
        }
      }
    }

    // The load balancer coordinates the web workers
    var loadBalancer = new LoadBalancer(webWorkerSrc, 4, onJobDone);

    /* #########################################################################
                      `Plot`'s  externally visible interface 
       #######################################################################*/

    /** 
     * Sets a special parameter, schedules 
     * the jobs that are necessary to compute 
     * the image for the special parameter.
     * 
     * Does not begin to override the content of
     * the visible canvas, this has to be 
     * triggered by a separate call to `preview`
     * with the same parameter.
     *
     * The id "visible" refers to the visible buffer.
     */
    this.redraw = function(id, param) {
    
      // clean load balancer's internal queue from obsolete jobs with 
      // same id
      loadBalancer.filterJobs(function(job) {
        return job.id !== id;
      });
      var f = funcFactory(param);
      ensureBufferExists(id);
      var bb = backBuffers[id];
      bb.param = param;
      var queue = 
        new QuasiPriorityQueue(approxMinPriority, approxMaxPriority, 16);
      var entireArea = new FunctionPatch(
        new Rect(minX, maxX, minY, maxY),
        new Rect(
          0, backBuffers.visible.canvas.width, 
          0, backBuffers.visible.canvas.height
        ),
        [f(maxX, maxY), f(minX, maxY),
         f(minX, minY), f(maxX, minY)]
      )
      queue.enqueue(entireArea, 0);
      bb.numTodos = 0;
      while(!queue.isEmpty()) {
        var head = queue.dequeue();
        if (head.screnRect.area <= 1024) {
          loadBalancer.addJob(
            {
              id : id,
              param : param,
              screnRect : head.screnRect,
              worldRect : head.worldRect,
              paintingSettings: paintingSettings
            }
          );
          bb.numTodos++;
          // poke the load balancer so that it tries to assign the jobs to 
          // idle workers 
          loadBalancer.assignJobs();
        } else {
          var ab = head.subdivide(f);
          var a = ab[0];
          var b = ab[1];
          var aValue = variationMeasure(a.values);
          var bValue = variationMeasure(b.values);
          queue.enqueue(a, aValue);
          queue.enqueue(b, bValue);
        }
      }
    };

    /**
     * Checks whether a buffer for `id` contains a complete image.
     */
    this.isReady = function(id) {
      var bb = backBuffers[id];
      if(bb) {
        return bb.numTodos === 0;
      } else {
        throw (
          "Checked whether " + id + " is ready, but no such buffer exists"
        );
      }
    };

    /**
     * Copies the content of a back-buffer with
     * specified `id` to the visible canvas.
     */
    this.show = function(id) {
      var visibleWidth = backBuffers.visible.canvas.width;
      var visibleHeight = backBuffers.visible.canvas.height;
      backBuffers.visible.context.putImageData(
        backBuffers[id].context.getImageData(0,0,visibleWidth, visibleHeight), 
        0, 0
      );
    };

    /**
     * Makes sure that all back buffers have the same size as the 
     * visible buffer, recomputes everything.
     */
    this.resize = function() {
      for (var id in backBuffers) {
        var bb = backBuffers[id];
        var p = bb.param;
        redraw(id, p);
      }
    };
  }

  return levelPlotModule;
})();