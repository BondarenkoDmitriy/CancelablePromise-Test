class CancelablePromise {
  constructor(
    callback,
    currentNativePromise = null,
    isCanceled = false,
    chainOfPromises = []
  ) {
    if (!currentNativePromise) getFunc(callback);

    this.isCanceled = isCanceled;

    this._currentNativePromise =
      currentNativePromise ??
      new Promise((resolve, reject) => {
        callback(
          (result) => {
            if (this.isCanceled) reject({ isCanceled: true });
            else resolve(result);
          },
          (error) => {
            if (this.isCanceled) reject({ isCanceled: true });
            else reject(error);
          }
        );
      });

    this._chainOfPromises = chainOfPromises;

    this._chainOfPromises.push(this);
  }

  then(onCompleted = (res) => res, onError) {
    getFunc(onCompleted);

    const { _currentNativePromise } = this;

    const cancellationPromise = new Promise((_, reject) => {
      this._chainOfPromises.push({ reject });
    });

    const nextPromise = Promise.race([
      _currentNativePromise.then(onCompleted),
      cancellationPromise,
    ]).catch(onError);

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

const getFunc = (func) => {
  if (typeof func !== "function") {
    throw new Error("Argument must be a function.");
  }};

module.exports = CancelablePromise;