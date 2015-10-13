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
    var approxBinIdx = Math.floor((priority - minPriority) * prioToBinFactor);
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