function Span(elem)
    if elem.classes:includes('japanese') then
        local japanese = elem.content[1].text
        local ruby = pandoc.pipe("./to-ruby.js", {japanese}, '')
        elem.content = {pandoc.RawInline('html', ruby)}
        return elem
    end
end
