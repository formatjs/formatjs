; Keywords
"number" @keyword
"date" @keyword
"time" @keyword
"select" @keyword
"plural" @keyword
"selectordinal" @keyword
"offset" @keyword

; Plural categories
(plural_key) @constant

; Identifiers (variable names)
(argument (identifier) @variable)
(number_element (identifier) @variable)
(date_element (identifier) @variable)
(time_element (identifier) @variable)
(select_element (identifier) @variable)
(plural_element (identifier) @variable)
(selectordinal_element (identifier) @variable)

; Tags
(tag_name) @tag
(open_tag "<" @punctuation.bracket)
(open_tag ">" @punctuation.bracket)
(close_tag "</" @punctuation.bracket)
(close_tag ">" @punctuation.bracket)
(self_closing_tag "<" @punctuation.bracket)
(self_closing_tag "/>" @punctuation.bracket)

; Punctuation
"{" @punctuation.bracket
"}" @punctuation.bracket
"," @punctuation.delimiter
":" @punctuation.delimiter

; Pound sign
(pound) @variable.builtin

; Skeletons
(number_skeleton) @string.special
(date_time_skeleton) @string.special

; Style text
(style_text) @string

; Literals
(literal) @string

; Numbers
(number) @number

; Select keys
(select_key) @constant
