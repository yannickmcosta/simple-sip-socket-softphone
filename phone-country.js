// Dialler country detection (flag / calling code) on top of libphonenumber-js.
// UX only: the PBX, not this code, decides whether a number may be dialled.
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory;
    else root.PhoneCountry = root.libphonenumber ? factory(root.libphonenumber) : null;
})(this, function (lib) {
    // Returns the string to hand the parser: formatting stripped and a leading
    // 00 international access prefix rewritten to +. Returns null for anything
    // that isn't a public number, e.g. PBX feature codes containing * or #.
    function toParseInput(raw) {
        const s = String(raw || '').replace(/[\s().\-\/]/g, '');
        if (!/^\+?\d*$/.test(s)) return null;
        return s.startsWith('00') ? '+' + s.slice(2) : s;
    }

    // Explicit international input (+ or 00) is identified by the number itself;
    // anything else is interpreted in the selected country's numbering context.
    // country is null when it can't be determined unambiguously yet (e.g. "+1").
    function detectCountry(raw, selectedCountry) {
        const input = toParseInput(raw);
        const international = !!input && input[0] === '+';
        const context = international ? undefined : selectedCountry || undefined;
        let country = context || null, callingCode = null, e164 = null;

        if (input && (international || context)) {
            const typing = new lib.AsYouType(context);
            typing.input(input);
            const parsed = lib.parsePhoneNumberFromString(input, context);
            if (parsed && parsed.isPossible()) e164 = parsed.number;
            country = (e164 && parsed.country) || typing.getCountry() || country;
            callingCode = typing.getCallingCode() || null;
        }
        if (country) callingCode = lib.getCountryCallingCode(country);
        return { international, country, callingCode, e164 };
    }

    function localeCountry(locales) {
        for (const l of locales || []) {
            try {
                const region = new Intl.Locale(l).region;
                if (region && lib.isSupportedCountry(region)) return region;
            } catch (e) { /* ignore malformed locale tags */ }
        }
        return null;
    }

    return { toParseInput, detectCountry, localeCountry };
});
