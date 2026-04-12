; Tag definitions for code navigation
(tag
  (open_tag (tag_name) @name)) @definition.tag

(self_closing_tag
  (tag_name) @name) @definition.tag

(argument
  (identifier) @name) @reference.variable

(number_element
  (identifier) @name) @reference.variable

(date_element
  (identifier) @name) @reference.variable

(time_element
  (identifier) @name) @reference.variable

(select_element
  (identifier) @name) @reference.variable

(plural_element
  (identifier) @name) @reference.variable

(selectordinal_element
  (identifier) @name) @reference.variable
