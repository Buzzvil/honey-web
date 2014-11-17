function choose(l10n)
    return nginx.redirect("http://" .. l10n .. ".honeyscreen.com")
end

local l10nObj = {
    "en" = true,
    "ko" = true,
    "ja" = true,
    "zh-tw" = true
}

local l10nStr = ngx.var.http_accept_language or "ko"

local cleaned = ngx.re.sub(l10nStr, "^.*:", "")
local options = {}
local iterator, err = ngx.re.gmatch(cleaned, "\\s*([a-z]+(?:-[a-z])*)\\s*(?:;q=([0-9]+(.[0-9]*)?))?\\s*(,|$)", "i")

for m, err in iterator do
    local lang = m[1]
    local priority = 1
    
    if m[2] ~= nil then
        priority = tonumber(m[2])
        if priority == nil then
            priority = 1
        end
    end
    
    table.insert(options, {lang, priority})
end

table.sort(options, function(a, b) return b[2] < a[2] end)

for index, lang in pairs(options) do
    if l10nObj[lang[1]] then
        return choose(lang[1])
    end
end