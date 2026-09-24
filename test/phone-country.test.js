const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the same UMD bundle the browser loads from the CDN.
const libDir = path.join(__dirname, '..', 'node_modules', 'libphonenumber-js');
const bundlePath = path.join(libDir, 'bundle', 'libphonenumber-max.js');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(bundlePath, 'utf8'), sandbox);
const { toParseInput, detectCountry, localeCountry } = require('../phone-country.js')(sandbox.libphonenumber);

const detect = (input, selected) => {
    const { country, callingCode, e164 } = detectCountry(input, selected);
    return { country, callingCode, e164 };
};

test('explicit + and 00 international numbers identify the destination', () => {
    for (const [digits, country, callingCode] of [
        ['442071234567', 'GB', '44'],
        ['33123456789', 'FR', '33'],
        ['18006927753', 'US', '1'],
    ]) {
        const expected = { country, callingCode, e164: '+' + digits };
        assert.deepEqual(detect('+' + digits, 'DE'), expected);
        assert.deepEqual(detect('00' + digits, 'DE'), expected);
    }
});

test('regression: US selected + 0018006927753 is +18006927753, not +10018006927753', () => {
    const result = detectCountry('0018006927753', 'US');
    assert.equal(result.e164, '+18006927753');
    assert.equal(result.international, true);
    assert.equal(toParseInput('0018006927753'), '+18006927753');
});

test('explicit international number overrides the selected country', () => {
    assert.equal(detect('+33123456789', 'US').country, 'FR');
    assert.equal(detect('0033123456789', 'GB').country, 'FR');
});

test('national-format numbers use the selected country as context', () => {
    assert.deepEqual(detect('01611234567', 'GB'), { country: 'GB', callingCode: '44', e164: '+441611234567' });
    assert.deepEqual(detect('2125551234', 'US'), { country: 'US', callingCode: '1', e164: '+12125551234' });
    // ...unless the library can legitimately determine otherwise (Toronto under NANP)
    assert.equal(detect('4165551234', 'US').country, 'CA');
});

test('empty input shows the selected country, and follows changes to it', () => {
    assert.deepEqual(detect('', 'GB'), { country: 'GB', callingCode: '44', e164: null });
    assert.deepEqual(detect('', 'FR'), { country: 'FR', callingCode: '33', e164: null });
    assert.deepEqual(detect('', null), { country: null, callingCode: null, e164: null });
});

test('clearing an international number returns to the selected context', () => {
    assert.equal(detect('+33123456789', 'GB').country, 'FR');
    assert.equal(detect('', 'GB').country, 'GB');
});

test('whitespace and formatting punctuation are tolerated', () => {
    for (const input of ['+44 20 7123 4567', '0044 20 7123 4567', '00 44 20 7123 4567', '+44 (0)20 7123 4567', '+44-20-7123-4567']) {
        assert.deepEqual(detect(input, 'US'), { country: 'GB', callingCode: '44', e164: '+442071234567' }, input);
    }
});

test('incomplete international input: calling code without inventing a region', () => {
    assert.deepEqual(detect('+', 'GB'), { country: null, callingCode: null, e164: null });
    assert.deepEqual(detect('00', 'GB'), { country: null, callingCode: null, e164: null });
    assert.deepEqual(detect('+33', 'GB'), { country: 'FR', callingCode: '33', e164: null });
    assert.deepEqual(detect('0033', 'GB'), { country: 'FR', callingCode: '33', e164: null });
    // +44 is shared (GB, GG, IM, JE): calling code known, region not yet
    assert.deepEqual(detect('+44', 'US'), { country: null, callingCode: '44', e164: null });
    assert.deepEqual(detect('0044', 'US'), { country: null, callingCode: '44', e164: null });
});

test('shared calling code +1 is not assumed to be the US', () => {
    assert.deepEqual(detect('+1', 'GB'), { country: null, callingCode: '1', e164: null });
    assert.equal(detect('+1416', 'GB').country, null);
    assert.equal(detect('+14165551234', 'GB').country, 'CA');
    assert.equal(detect('+18765551234', 'GB').country, 'JM');
    assert.equal(detect('+12125551234', 'GB').country, 'US');
});

test('input that is not a recognisable public number keeps the selected context', () => {
    assert.deepEqual(detect('1234', 'GB'), { country: 'GB', callingCode: '44', e164: null });
    assert.deepEqual(detect('+999', 'GB'), { country: null, callingCode: null, e164: null });
    assert.deepEqual(detect('0', 'GB'), { country: 'GB', callingCode: '44', e164: null });
});

test('PBX feature codes with * and # are left alone', () => {
    for (const input of ['*72', '*9#', '#', '**1234', '*69']) {
        assert.equal(toParseInput(input), null, input);
        assert.deepEqual(detect(input, 'GB'), { country: 'GB', callingCode: '44', e164: null }, input);
    }
});

test('default country from browser locale', () => {
    assert.equal(localeCountry(['en-GB', 'en']), 'GB');
    assert.equal(localeCountry(['en', 'fr-FR']), 'FR');
    assert.equal(localeCountry(['en', 'bogus!!']), null);
});

test('CDN version pinned in the HTML matches the tested library version', () => {
    const { version } = JSON.parse(fs.readFileSync(path.join(libDir, 'package.json'), 'utf8'));
    for (const file of ['softphone.html', 'softphone-jwt.html']) {
        const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        assert.ok(html.includes(`libphonenumber-js@${version}/bundle/libphonenumber-max.js`), file);
    }
});
