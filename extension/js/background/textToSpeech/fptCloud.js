/**
 * @name Base64File
 * @type {object}
 * @property {string} base64
 * @property {string} contentType
 */

/**
 * @param {string} word
 * @return Promise<object>
 */
async function fptCloudTts(word) {
  /**
   * @return {Promise<Blob>}
   */
  async function loadSoundFile() {
    const API_KEY = '[replace-with-your-api-key]';
    const RETRY_DELAY = 20 * 1000;
    const TIMEOUT_DELAY = 120 * 1000;

    const response = await fetch(
      'https://api.fpt.ai/hmi/tts/v5',
      {
        method: 'POST',
        cache: 'no-cache',
        body: word,
        headers: {
          'api-key': API_KEY,
          'speed': '',
          'voice': 'banmai'
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status} requesting a ${word} sound. ` + await response.text());
    }

    const result = await response.json();

    if (result.error || !result.async) {
      throw new Error(`Error requesting a ${word} sound. ` + result.message);
    }

    let isCanceled = false;

    return Promise.race(
      [
        new Promise(async (resolve, reject) => {
          const retrySoundUrl = async () => {
            if (isCanceled) {
              reject(`Request for ${word} sound was canceled`);
              return;
            }

            try {
              const soundResponse = await fetch(
                'https://corsproxy.io/?' + encodeURIComponent(result.async),
                { cache: 'no-cache' }
              );

              if (!soundResponse.ok) {
                setTimeout(retrySoundUrl, RETRY_DELAY);
              } else {
                resolve(await soundResponse.blob());
              }
            } catch (error) {
              throw new Error(`Error requesting a ${word} sound. ` + error);
            }
          };

          await retrySoundUrl();
        }),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            isCanceled = true;
            reject(`Waiting time expired when requesting a ${word} sound`);
          }, TIMEOUT_DELAY)
        })
      ]
    );
  }

  /**
   * @param {Blob} blob
   * @return {Promise<Base64File>}
   */
  function serializeBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        const dataUrl = reader.result;
        const base64 = dataUrl.split(',')[1];
        resolve({ base64: base64, contentType: blob.type });
      };
      reader.onerror = () => reject(new Error('Blob serialization error'));
      reader.readAsDataURL(blob);
    });
  }

  return serializeBlob(await loadSoundFile());
}
