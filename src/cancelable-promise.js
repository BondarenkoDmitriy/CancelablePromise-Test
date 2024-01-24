const funcOrThrow = (func, msg = "Argument must be a function.") => {
  if (typeof func !== "function") throw new Error(msg);
};

class CancelablePromise {
  constructor(
    callback,
    currentNativePromise = null,
    isCanceled = false,
    chainOfPromises = []
  ) {
    if (!currentNativePromise) funcOrThrow(callback);

    this.isCanceled = isCanceled;

    this._currentNativePromise =
      currentNativePromise ??
      new Promise((resolve, reject) => {
        callback((result) => {
          if (this.isCanceled) reject({ isCanceled: this.isCanceled });
          else resolve(result);
        }, reject);
      });

    this._chainOfPromises = chainOfPromises;

    this._chainOfPromises.push(this);
  }

  then(onCompleted = (res) => res, onError) {
    funcOrThrow(onCompleted);

    const { _currentNativePromise } = this;

    const nextPromise = _currentNativePromise
      .then(onCompleted, onError)
      .catch(onError);

    return new CancelablePromise(
      null,
      nextPromise,
      this.isCanceled,
      this._chainOfPromises
    );
  }

  catch(onError) {
    return this.then(undefined, onError);
  }

  cancel() {
    this._chainOfPromises.forEach((promise) => (promise.isCanceled = true));

    return this;
  }
}

module.exports = CancelablePromise;