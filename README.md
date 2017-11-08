# What is this?
Hello, this is the backend API and Streaming API Proxy for yaponiya.reblws.me, a realtime data visualization project for Japanese characters in Twitter tweets (thats a mouthful). 

There are three scripts used in modern Japanese language, hiragana and katakana (used only in Japan), and kanji (pretty much Chinese characters). There are tens of thousands of Japanese kanjis in the wild but only 2036 are mandated by the Japanese government as part of the education system. This webapp tries to visualize which characters are most frequently used in Japanese tweets.

There are three simple GET APIs implemented for this project (under 'app.js'). In addition, a streaming API proxy from Twitter (under 'app-stream.js') is also implemented for the realtime part of this webapp. The APIs are RESTfully named and implemented using express.js, mongodb, and redis.

# API
## /api/kanji/:kanji 
Returns information about a specific kanji. If specified character is not a kanji returns nothing and 404. More information of how the json schema look like at 'schema/kanji-schema.json'.

*Example*
% `curl http://yaponiya.reblws.me:5000/api/kanji/明`
`{"id":2664,"reading":{"nanori":["あきら","あけ","あす","きら","け","さや","さやか","とし","はる","み","め"],...}`

% `curl http://yaponiya.reblws.me:5000/api/kanji/test`
`{}`

## /api/order/:type
Returns the ordering for Japanese kanjis based on :type. Valid types are `jlpt`, `grade`, `news`, `tweet`, `heisig`, `stroke`. Likewise, it will return nothing and a 404 if the type is not one of the listed above.

*Example*
% `curl http://yaponiya.reblws.me:5000/api/order/jlpt`
`{"亜":1,"阿":1,"哀":1,"愛":2,"葵":1,"茜":1,"悪":3,"握":1,"渥":1,"旭":1,"梓":1,"圧":2,"扱":1,"絢":1,"綾":1,"鮎":1,"安":4,"暗":3...}`

## /api/stroke/:kanji
Returns the stroke order for a specified kanji, hiragana, or katakana (Japanese scripts).

*Example*
% `curl http://yaponiya.reblws.me:5000/api/stroke/明`
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109"><g id="kvg:StrokePaths_06642" ...>`


# Notes
1) The kanji data are available thanks to the efforts of people over at http://kanjivg.tagaini.net/. The only downside is that the provided data are in XML. I have transformed them to json and its available here under 'kanjidic.json'.

2) Escaping callback hell was also quite the challenge as this is my first time writing modern Javascript.

# Frontend Components
The frontend React components are available over at https://github.com/aulb/yaponiya-ui.
