    async function generateSklandSign(token, path, queryOrBody, timestamp) {
        const headerForSign = {
            platform: '1',
            timestamp,
            dId: '',
            vName: '1.21.0'
        };
        const source = path + queryOrBody + timestamp + JSON.stringify(headerForSign);
        const hmac = await hmacSha256Hex(token, source);
        return md5Hex(hmac);
    }

    async function hmacSha256Hex(key, message) {
        const blockSize = 64;
        let keyBytes = utf8Bytes(key);
        if (keyBytes.length > blockSize) keyBytes = await sha256Bytes(keyBytes);

        const paddedKey = new Uint8Array(blockSize);
        paddedKey.set(keyBytes);

        const outerPad = new Uint8Array(blockSize);
        const innerPad = new Uint8Array(blockSize);
        for (let i = 0; i < blockSize; i++) {
            outerPad[i] = paddedKey[i] ^ 0x5c;
            innerPad[i] = paddedKey[i] ^ 0x36;
        }

        const innerHash = await sha256Bytes(concatBytes(innerPad, utf8Bytes(message)));
        const finalHash = await sha256Bytes(concatBytes(outerPad, innerHash));
        return bytesToHex(finalHash);
    }

    async function sha256Bytes(bytes) {
        if (!window.crypto?.subtle) throw new Error('当前浏览器不支持森空岛请求签名所需的 WebCrypto。');
        return new Uint8Array(await window.crypto.subtle.digest('SHA-256', bytes));
    }

    function utf8Bytes(value) {
        return new TextEncoder().encode(String(value));
    }

    function concatBytes(left, right) {
        const combined = new Uint8Array(left.length + right.length);
        combined.set(left, 0);
        combined.set(right, left.length);
        return combined;
    }

    function bytesToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function md5Hex(input) {
        const bytes = utf8Bytes(input);
        const wordCount = (((bytes.length + 8) >>> 6) + 1) * 16;
        const words = new Array(wordCount).fill(0);
        for (let i = 0; i < bytes.length; i++) {
            words[i >> 2] |= bytes[i] << ((i % 4) * 8);
        }
        words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
        const bitLength = bytes.length * 8;
        words[wordCount - 2] = bitLength >>> 0;
        words[wordCount - 1] = Math.floor(bitLength / 0x100000000) >>> 0;

        let a = 0x67452301;
        let b = 0xefcdab89;
        let c = 0x98badcfe;
        let d = 0x10325476;

        for (let i = 0; i < wordCount; i += 16) {
            const oldA = a;
            const oldB = b;
            const oldC = c;
            const oldD = d;

            a = md5Ff(a, b, c, d, words[i], 7, -680876936);
            d = md5Ff(d, a, b, c, words[i + 1], 12, -389564586);
            c = md5Ff(c, d, a, b, words[i + 2], 17, 606105819);
            b = md5Ff(b, c, d, a, words[i + 3], 22, -1044525330);
            a = md5Ff(a, b, c, d, words[i + 4], 7, -176418897);
            d = md5Ff(d, a, b, c, words[i + 5], 12, 1200080426);
            c = md5Ff(c, d, a, b, words[i + 6], 17, -1473231341);
            b = md5Ff(b, c, d, a, words[i + 7], 22, -45705983);
            a = md5Ff(a, b, c, d, words[i + 8], 7, 1770035416);
            d = md5Ff(d, a, b, c, words[i + 9], 12, -1958414417);
            c = md5Ff(c, d, a, b, words[i + 10], 17, -42063);
            b = md5Ff(b, c, d, a, words[i + 11], 22, -1990404162);
            a = md5Ff(a, b, c, d, words[i + 12], 7, 1804603682);
            d = md5Ff(d, a, b, c, words[i + 13], 12, -40341101);
            c = md5Ff(c, d, a, b, words[i + 14], 17, -1502002290);
            b = md5Ff(b, c, d, a, words[i + 15], 22, 1236535329);

            a = md5Gg(a, b, c, d, words[i + 1], 5, -165796510);
            d = md5Gg(d, a, b, c, words[i + 6], 9, -1069501632);
            c = md5Gg(c, d, a, b, words[i + 11], 14, 643717713);
            b = md5Gg(b, c, d, a, words[i], 20, -373897302);
            a = md5Gg(a, b, c, d, words[i + 5], 5, -701558691);
            d = md5Gg(d, a, b, c, words[i + 10], 9, 38016083);
            c = md5Gg(c, d, a, b, words[i + 15], 14, -660478335);
            b = md5Gg(b, c, d, a, words[i + 4], 20, -405537848);
            a = md5Gg(a, b, c, d, words[i + 9], 5, 568446438);
            d = md5Gg(d, a, b, c, words[i + 14], 9, -1019803690);
            c = md5Gg(c, d, a, b, words[i + 3], 14, -187363961);
            b = md5Gg(b, c, d, a, words[i + 8], 20, 1163531501);
            a = md5Gg(a, b, c, d, words[i + 13], 5, -1444681467);
            d = md5Gg(d, a, b, c, words[i + 2], 9, -51403784);
            c = md5Gg(c, d, a, b, words[i + 7], 14, 1735328473);
            b = md5Gg(b, c, d, a, words[i + 12], 20, -1926607734);

            a = md5Hh(a, b, c, d, words[i + 5], 4, -378558);
            d = md5Hh(d, a, b, c, words[i + 8], 11, -2022574463);
            c = md5Hh(c, d, a, b, words[i + 11], 16, 1839030562);
            b = md5Hh(b, c, d, a, words[i + 14], 23, -35309556);
            a = md5Hh(a, b, c, d, words[i + 1], 4, -1530992060);
            d = md5Hh(d, a, b, c, words[i + 4], 11, 1272893353);
            c = md5Hh(c, d, a, b, words[i + 7], 16, -155497632);
            b = md5Hh(b, c, d, a, words[i + 10], 23, -1094730640);
            a = md5Hh(a, b, c, d, words[i + 13], 4, 681279174);
            d = md5Hh(d, a, b, c, words[i], 11, -358537222);
            c = md5Hh(c, d, a, b, words[i + 3], 16, -722521979);
            b = md5Hh(b, c, d, a, words[i + 6], 23, 76029189);
            a = md5Hh(a, b, c, d, words[i + 9], 4, -640364487);
            d = md5Hh(d, a, b, c, words[i + 12], 11, -421815835);
            c = md5Hh(c, d, a, b, words[i + 15], 16, 530742520);
            b = md5Hh(b, c, d, a, words[i + 2], 23, -995338651);

            a = md5Ii(a, b, c, d, words[i], 6, -198630844);
            d = md5Ii(d, a, b, c, words[i + 7], 10, 1126891415);
            c = md5Ii(c, d, a, b, words[i + 14], 15, -1416354905);
            b = md5Ii(b, c, d, a, words[i + 5], 21, -57434055);
            a = md5Ii(a, b, c, d, words[i + 12], 6, 1700485571);
            d = md5Ii(d, a, b, c, words[i + 3], 10, -1894986606);
            c = md5Ii(c, d, a, b, words[i + 10], 15, -1051523);
            b = md5Ii(b, c, d, a, words[i + 1], 21, -2054922799);
            a = md5Ii(a, b, c, d, words[i + 8], 6, 1873313359);
            d = md5Ii(d, a, b, c, words[i + 15], 10, -30611744);
            c = md5Ii(c, d, a, b, words[i + 6], 15, -1560198380);
            b = md5Ii(b, c, d, a, words[i + 13], 21, 1309151649);
            a = md5Ii(a, b, c, d, words[i + 4], 6, -145523070);
            d = md5Ii(d, a, b, c, words[i + 11], 10, -1120210379);
            c = md5Ii(c, d, a, b, words[i + 2], 15, 718787259);
            b = md5Ii(b, c, d, a, words[i + 9], 21, -343485551);

            a = md5Add(a, oldA);
            b = md5Add(b, oldB);
            c = md5Add(c, oldC);
            d = md5Add(d, oldD);
        }

        return md5WordToHex(a) + md5WordToHex(b) + md5WordToHex(c) + md5WordToHex(d);
    }

    function md5Add(left, right) {
        return (left + right) >>> 0;
    }

    function md5RotateLeft(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }

    function md5Cmn(query, a, b, x, shift, constant) {
        return md5Add(md5RotateLeft(md5Add(md5Add(a, query), md5Add(x, constant)), shift), b);
    }

    function md5Ff(a, b, c, d, x, shift, constant) {
        return md5Cmn((b & c) | (~b & d), a, b, x, shift, constant);
    }

    function md5Gg(a, b, c, d, x, shift, constant) {
        return md5Cmn((b & d) | (c & ~d), a, b, x, shift, constant);
    }

    function md5Hh(a, b, c, d, x, shift, constant) {
        return md5Cmn(b ^ c ^ d, a, b, x, shift, constant);
    }

    function md5Ii(a, b, c, d, x, shift, constant) {
        return md5Cmn(c ^ (b | ~d), a, b, x, shift, constant);
    }

    function md5WordToHex(word) {
        let output = '';
        for (let i = 0; i < 4; i++) {
            output += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
        }
        return output;
    }
