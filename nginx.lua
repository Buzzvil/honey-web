local options = {}
local it, err = ngx.re.gmatch(
    ngx.var.http_accept_language or "ko",
    [[(\w+(?:-\w+)*)(?:\s*;\s*q\s*=\s*(\d+.?\d*))?]]
)

local l10nKey
local l10nObj = {
    ["en"] = "en",
    ["ko"] = "ko",
    ["ja"] = "ja",
    ["zh"] = "zh-tw"
}

for m, err in it do
    table.insert(options, {
        string.lower(m[1]),
        string.sub(m[1], 1, 2),
        tonumber(m[2]) or 1
    })
end

table.sort(options, function (a, b)
    return b[3] < a[3]
end)

for i, l10n in pairs(options) do
    l10nKey = l10nObj[l10n[1]] or l10nObj[l10n[2]]
    if l10nKey then break end
end

ngx.redirect("http://" .. (l10nKey or "ko") .. ".honeyscreen.com" .. ngx.var.request_uri)