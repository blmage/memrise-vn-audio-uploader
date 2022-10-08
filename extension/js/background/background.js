MESSAGES.LOAD_SOUND.subscribe((request, sender, sendResponse) => {
    const result = (request.languageCode === 'vi-VN')
        ? fptCloudTts(request.word)
        : googleTranslateTts(request.word, request.languageCode);

    result
        .then(/** Base64File */ base64file => {
            sendResponse({
                success: true,
                sound: base64file
            });
        })
        .catch(/** Error */ error => {
            sendResponse({
                success: false,
                error: error.message
            });
        });

    return true;
});
