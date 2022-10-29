use std::collections::{HashMap, HashSet};

use base64ct::{Base64, Encoding};
use icu_messageformat_parser::{Parser, ParserOptions};
use once_cell::sync::Lazy;
use regex::{Captures, Regex as Regexp};
use serde::{ser::SerializeMap, Deserialize, Serialize};
use sha2::{Digest, Sha512};
use swc_core::{
    common::{
        comments::{Comment, CommentKind, Comments},
        source_map::Pos,
        BytePos, Loc, SourceMapper, Span, Spanned, DUMMY_SP,
    },
    ecma::{
        ast::{
            CallExpr, Callee, Expr, ExprOrSpread, Ident, JSXAttr, JSXAttrName, JSXAttrOrSpread,
            JSXAttrValue, JSXElementName, JSXExpr, JSXNamespacedName, JSXOpeningElement,
            KeyValueProp, Lit, MemberProp, ModuleItem, ObjectLit, Prop, PropName, PropOrSpread,
            Str,
        },
        visit::{noop_visit_mut_type, VisitMut, VisitMutWith},
    },
};

pub static WHITESPACE_REGEX: Lazy<Regexp> = Lazy::new(|| Regexp::new(r"\s+").unwrap());

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct FormatJSPluginOptions {
    pub pragma: String,
    pub remove_default_message: bool,
    pub id_interpolate_pattern: Option<String>,
    pub ast: bool,
    pub extract_source_location: bool,
    pub preserve_whitespace: bool,
    pub __debug_extracted_messages_comment: bool,
    pub additional_function_names: Vec<String>,
    pub additional_component_names: Vec<String>,
}

#[derive(Debug, Clone, Default)]
pub struct JSXMessageDescriptorPath {
    id: Option<JSXAttrValue>,
    default_message: Option<JSXAttrValue>,
    description: Option<JSXAttrValue>,
}

#[derive(Debug, Clone, Default)]
pub struct CallExprMessageDescriptorPath {
    id: Option<Expr>,
    default_message: Option<Expr>,
    description: Option<Expr>,
}

#[derive(Debug, Clone, Default)]
pub struct MessageDescriptor {
    id: Option<String>,
    default_message: Option<String>,
    description: Option<MessageDescriptionValue>,
}

// TODO: consolidate with get_message_descriptor_key_from_call_expr?
fn get_message_descriptor_key_from_jsx(name: &JSXAttrName) -> &str {
    match name {
        JSXAttrName::Ident(name)
        | JSXAttrName::JSXNamespacedName(JSXNamespacedName { name, .. }) => &*name.sym,
    }

    // NOTE: Do not support evaluatePath()
}

fn get_message_descriptor_key_from_call_expr(name: &PropName) -> Option<&str> {
    match name {
        PropName::Ident(name) => Some(&*name.sym),
        PropName::Str(name) => Some(&*name.value),
        _ => None,
    }

    // NOTE: Do not support evaluatePath()
}

// TODO: Consolidate with create_message_descriptor_from_call_expr
fn create_message_descriptor_from_jsx_attr(
    attrs: &Vec<JSXAttrOrSpread>,
) -> JSXMessageDescriptorPath {
    let mut ret = JSXMessageDescriptorPath::default();
    for attr in attrs {
        if let JSXAttrOrSpread::JSXAttr(JSXAttr { name, value, .. }) = attr {
            let key = get_message_descriptor_key_from_jsx(name);

            match key {
                "id" => {
                    ret.id = value.clone();
                }
                "defaultMessage" => {
                    ret.default_message = value.clone();
                }
                "description" => {
                    ret.description = value.clone();
                }
                _ => {
                    //unexpected
                }
            }
        }
    }

    ret
}

fn create_message_descriptor_from_call_expr(
    props: &Vec<PropOrSpread>,
) -> CallExprMessageDescriptorPath {
    let mut ret = CallExprMessageDescriptorPath::default();
    for prop in props {
        if let PropOrSpread::Prop(prop) = prop {
            if let Prop::KeyValue(KeyValueProp { key, value }) = &**prop {
                if let Some(key) = get_message_descriptor_key_from_call_expr(key) {
                    match key {
                        "id" => {
                            ret.id = Some(*value.clone());
                        }
                        "defaultMessage" => {
                            ret.default_message = Some(*value.clone());
                        }
                        "description" => {
                            ret.description = Some(*value.clone());
                        }
                        _ => {
                            //unexpected
                        }
                    }
                };
            }
        }
    }

    ret
}

fn get_jsx_message_descriptor_value(
    value: &Option<JSXAttrValue>,
    is_message_node: Option<bool>,
) -> Option<String> {
    if value.is_none() {
        return None;
    }
    let value = value.as_ref().expect("Should be available");

    // NOTE: do not support evaluatePath
    match value {
        JSXAttrValue::JSXExprContainer(container) => {
            if is_message_node.unwrap_or(false) {
                if let JSXExpr::Expr(expr) = &container.expr {
                    // If this is already compiled, no need to recompiled it
                    if let Expr::Array(..) = &**expr {
                        return None;
                    }
                }
            }

            return match &container.expr {
                JSXExpr::Expr(expr) => match &**expr {
                    Expr::Lit(lit) => match &lit {
                        Lit::Str(str) => Some(str.value.to_string()),
                        _ => None,
                    },
                    Expr::Tpl(tpl) => {
                        //NOTE: This doesn't fully evaluate templates
                        Some(
                            tpl.quasis
                                .iter()
                                .map(|q| {
                                    q.cooked
                                        .as_ref()
                                        .map(|v| v.to_string())
                                        .unwrap_or("".to_string())
                                })
                                .collect::<Vec<String>>()
                                .join(""),
                        )
                    }
                    _ => None,
                },
                _ => None,
            };
        }
        JSXAttrValue::Lit(lit) => match &lit {
            Lit::Str(str) => Some(str.value.to_string()),
            _ => None,
        },
        _ => None,
    }
}

fn get_call_expr_message_descriptor_value(
    value: &Option<Expr>,
    _is_message_node: Option<bool>,
) -> Option<String> {
    if value.is_none() {
        return None;
    }

    let value = value.as_ref().expect("Should be available");

    // NOTE: do not support evaluatePath
    match value {
        Expr::Ident(ident) => Some(ident.sym.to_string()),
        Expr::Lit(lit) => match &lit {
            Lit::Str(str) => Some(str.value.to_string()),
            _ => None,
        },
        Expr::Tpl(tpl) => {
            //NOTE: This doesn't fully evaluate templates
            Some(
                tpl.quasis
                    .iter()
                    .map(|q| {
                        q.cooked
                            .as_ref()
                            .map(|v| v.to_string())
                            .unwrap_or("".to_string())
                    })
                    .collect::<Vec<String>>()
                    .join(""),
            )
        }
        _ => None,
    }
}

#[derive(Debug, Clone, Deserialize)]
pub enum MessageDescriptionValue {
    Str(String),
    Obj(ObjectLit),
}

impl Serialize for MessageDescriptionValue {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            MessageDescriptionValue::Str(str) => serializer.serialize_str(str),
            // NOTE: this is good enough to barely pass key-value object serialization. Not a complete implementation.
            MessageDescriptionValue::Obj(obj) => {
                let mut state = serializer.serialize_map(Some(obj.props.len()))?;
                for prop in &obj.props {
                    match prop {
                        PropOrSpread::Prop(prop) => {
                            match &**prop {
                                Prop::KeyValue(key_value) => {
                                    let key = match &key_value.key {
                                        PropName::Ident(ident) => ident.sym.to_string(),
                                        PropName::Str(str) => str.value.to_string(),
                                        _ => {
                                            //unexpected
                                            continue;
                                        }
                                    };
                                    let value = match &*key_value.value {
                                        Expr::Lit(lit) => match &lit {
                                            Lit::Str(str) => str.value.to_string(),
                                            _ => {
                                                //unexpected
                                                continue;
                                            }
                                        },
                                        _ => {
                                            //unexpected
                                            continue;
                                        }
                                    };
                                    state.serialize_entry(&key, &value)?;
                                }
                                _ => {
                                    //unexpected
                                    continue;
                                }
                            }
                        }
                        _ => {
                            //unexpected
                            continue;
                        }
                    }
                }
                state.end()
            }
        }
    }
}

// NOTE: due to not able to support static evaluation, this
// fn manually expands possible values for the description values
// from string to object.
//TODO: Consolidate with get_call_expr_message_descriptor_value_maybe_object
fn get_jsx_message_descriptor_value_maybe_object(
    value: &Option<JSXAttrValue>,
    is_message_node: Option<bool>,
) -> Option<MessageDescriptionValue> {
    if value.is_none() {
        return None;
    }
    let value = value.as_ref().expect("Should be available");

    // NOTE: do not support evaluatePath
    match value {
        JSXAttrValue::JSXExprContainer(container) => {
            if is_message_node.unwrap_or(false) {
                if let JSXExpr::Expr(expr) = &container.expr {
                    // If this is already compiled, no need to recompiled it
                    if let Expr::Array(..) = &**expr {
                        return None;
                    }
                }
            }

            return match &container.expr {
                JSXExpr::Expr(expr) => match &**expr {
                    Expr::Lit(lit) => match &lit {
                        Lit::Str(str) => Some(MessageDescriptionValue::Str(str.value.to_string())),
                        _ => None,
                    },
                    Expr::Object(object_lit) => {
                        Some(MessageDescriptionValue::Obj(object_lit.clone()))
                    }
                    _ => None,
                },
                _ => None,
            };
        }
        JSXAttrValue::Lit(lit) => match &lit {
            Lit::Str(str) => Some(MessageDescriptionValue::Str(str.value.to_string())),
            _ => None,
        },
        _ => None,
    }
}

fn get_call_expr_message_descriptor_value_maybe_object(
    value: &Option<Expr>,
    _is_message_node: Option<bool>,
) -> Option<MessageDescriptionValue> {
    if value.is_none() {
        return None;
    }

    let value = value.as_ref().expect("Should be available");
    // NOTE: do not support evaluatePath
    match value {
        Expr::Ident(ident) => Some(MessageDescriptionValue::Str(ident.sym.to_string())),
        Expr::Lit(lit) => match &lit {
            Lit::Str(str) => Some(MessageDescriptionValue::Str(str.value.to_string())),
            _ => None,
        },
        Expr::Object(object_lit) => Some(MessageDescriptionValue::Obj(object_lit.clone())),
        _ => None,
    }
}

// TODO: Consolidate with get_call_expr_icu_message_value
fn get_jsx_icu_message_value(
    message_path: &Option<JSXAttrValue>,
    preserve_whitespace: bool,
) -> String {
    if message_path.is_none() {
        return "".to_string();
    }

    let message =
        get_jsx_message_descriptor_value(message_path, Some(true)).unwrap_or("".to_string());

    let message = if !preserve_whitespace {
        let message = WHITESPACE_REGEX.replace_all(&message, " ");
        message.trim().to_string()
    } else {
        message
    };

    let mut parser = Parser::new(message.as_str(), &ParserOptions::default());

    if let Err(e) = parser.parse() {
        let is_literal_err = if let Some(message_path) = message_path {
            if let JSXAttrValue::Lit(..) = message_path {
                if message.contains("\\\\") {
                    true
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        };

        #[cfg(feature = "plugin")]
        let handler = &swc_core::plugin::errors::HANDLER;

        #[cfg(feature = "custom_transform")]
        let handler = &swc_core::common::errors::HANDLER;

        if is_literal_err {
            #[cfg(any(feature = "plugin", feature = "custom_transform"))]
            {
                handler.with(|handler| {
                    handler
                        .struct_err(
                            r#"
                    [React Intl] Message failed to parse.
                    It looks like `\\`s were used for escaping,
                    this won't work with JSX string literals.
                    Wrap with `{{}}`.
                    See: http://facebook.github.io/react/docs/jsx-gotchas.html
                    "#,
                        )
                        .emit()
                });
            }
        } else {
            #[cfg(any(feature = "plugin", feature = "custom_transform"))]
            {
                handler.with(|handler| {
                    handler
                        .struct_warn(
                            r#"
                    [React Intl] Message failed to parse.
                    See: https://formatjs.io/docs/core-concepts/icu-syntax
                    \n {:#?}
                    "#,
                        )
                        .emit();
                    handler
                        .struct_err(&format!("SyntaxError: {}", e.kind.to_string()))
                        .emit()
                });
            }
        }
    }

    return message;
}

fn get_call_expr_icu_message_value(
    message_path: &Option<Expr>,
    preserve_whitespace: bool,
) -> String {
    if message_path.is_none() {
        return "".to_string();
    }

    let message =
        get_call_expr_message_descriptor_value(message_path, Some(true)).unwrap_or("".to_string());

    let message = if !preserve_whitespace {
        let message = WHITESPACE_REGEX.replace_all(&message, " ");
        message.trim().to_string()
    } else {
        message
    };

    let mut parser = Parser::new(message.as_str(), &ParserOptions::default());

    if let Err(e) = parser.parse() {
        #[cfg(feature = "plugin")]
        let handler = &swc_core::plugin::errors::HANDLER;

        #[cfg(feature = "custom_transform")]
        let handler = &swc_core::common::errors::HANDLER;

        #[cfg(any(feature = "plugin", feature = "custom_transform"))]
        {
            handler.with(|handler| {
                handler
                    .struct_warn(
                        r#"
                    [React Intl] Message failed to parse.
                    See: https://formatjs.io/docs/core-concepts/icu-syntax
                    \n {:#?}
                    "#,
                    )
                    .emit();
                handler
                    .struct_err(&format!("SyntaxError: {}", e.kind.to_string()))
                    .emit()
            });
        }
    }

    return message;
}

fn interpolate_name(resource_path: &str, name: &str, content: &str) -> Option<String> {
    let filename = name;

    let content = content;

    let ext = "bin";
    let basename = "file";
    let directory = "";
    let folder = "";
    let query = "";

    /*
      if (resource_path) {
      const parsed = path.parse(loaderContext.resourcePath)
      let resourcePath = loaderContext.resourcePath

      if (parsed.ext) {
        ext = parsed.ext.slice(1)
      }

      if (parsed.dir) {
        basename = parsed.name
        resourcePath = parsed.dir + path.sep
      }

      if (typeof context !== 'undefined') {
        directory = path
          .relative(context, resourcePath + '_')
          .replace(/\\/g, '/')
          .replace(/\.\.(\/)?/g, '_$1')
        directory = directory.slice(0, -1)
      } else {
        directory = resourcePath.replace(/\\/g, '/').replace(/\.\.(\/)?/g, '_$1')
      }

      if (directory.length === 1) {
        directory = ''
      } else if (directory.length > 1) {
        folder = path.basename(directory)
      }
    }
      */

    let mut url = filename.to_string();
    let r = Regexp::new(r#"\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]"#)
        .unwrap();

    url = r
        .replace(url.as_str(), |cap: &Captures| {
            let hash_type = cap.get(1);
            let digest_type = cap.get(2);
            let max_length = cap.get(3);

            // TODO: support hashtype
            let mut hasher = Sha512::new();
            hasher.update(content.as_bytes());
            let hash = hasher.finalize();
            let base64_hash = Base64::encode_string(&hash);

            if let Some(max_length) = max_length {
                base64_hash[0..max_length.as_str().parse::<usize>().unwrap()].to_string()
            } else {
                base64_hash
            }
        })
        .to_string();

    /*
    url = url
      .replace(/\[ext\]/gi, () => ext)
      .replace(/\[name\]/gi, () => basename)
      .replace(/\[path\]/gi, () => directory)
      .replace(/\[folder\]/gi, () => folder)
      .replace(/\[query\]/gi, () => query)
    */

    Some(url.to_string())
}

// TODO: Consolidate with evaluate_call_expr_message_descriptor
fn evaluate_jsx_message_descriptor(
    descriptor_path: &JSXMessageDescriptorPath,
    options: &FormatJSPluginOptions,
    filename: &str,
) -> MessageDescriptor {
    let id = get_jsx_message_descriptor_value(&descriptor_path.id, None);
    let default_message = get_jsx_icu_message_value(
        &descriptor_path.default_message,
        options.preserve_whitespace,
    );

    let description =
        get_jsx_message_descriptor_value_maybe_object(&descriptor_path.description, None);

    // Note: do not support override fn
    let id = if id.is_none() && default_message != "" {
        let interpolate_pattern = if let Some(interpolate_pattern) = &options.id_interpolate_pattern
        {
            interpolate_pattern.as_str()
        } else {
            "[sha512:contenthash:base64:6]"
        };

        let content = if let Some(description) = &description {
            if let MessageDescriptionValue::Str(description) = description {
                format!("{}#{}", default_message, description)
            } else {
                default_message.clone()
            }
        } else {
            default_message.clone()
        };

        interpolate_name(filename, interpolate_pattern, &content)
    } else {
        id
    };

    MessageDescriptor {
        id,
        default_message: Some(default_message),
        description,
    }
}

fn evaluate_call_expr_message_descriptor(
    descriptor_path: &CallExprMessageDescriptorPath,
    options: &FormatJSPluginOptions,
    filename: &str,
) -> MessageDescriptor {
    let id = get_call_expr_message_descriptor_value(&descriptor_path.id, None);
    let default_message = get_call_expr_icu_message_value(
        &descriptor_path.default_message,
        options.preserve_whitespace,
    );

    let description =
        get_call_expr_message_descriptor_value_maybe_object(&descriptor_path.description, None);

    let id = if id.is_none() && default_message != "" {
        let interpolate_pattern = if let Some(interpolate_pattern) = &options.id_interpolate_pattern
        {
            interpolate_pattern.as_str()
        } else {
            "[sha512:contenthash:base64:6]"
        };

        let content = if let Some(description) = &description {
            if let MessageDescriptionValue::Str(description) = description {
                format!("{}#{}", default_message, description)
            } else {
                default_message.clone()
            }
        } else {
            default_message.clone()
        };
        interpolate_name(filename, interpolate_pattern, &content)
    } else {
        id
    };

    MessageDescriptor {
        id,
        default_message: Some(default_message),
        description,
    }
}

fn store_message(
    messages: &mut Vec<ExtractedMessage>,
    descriptor: &MessageDescriptor,
    filename: &str,
    location: Option<(Loc, Loc)>,
) {
    if descriptor.id.is_none() && descriptor.default_message.is_none() {
        #[cfg(feature = "plugin")]
        let handler = &swc_core::plugin::errors::HANDLER;

        #[cfg(feature = "custom_transform")]
        let handler = &swc_core::common::errors::HANDLER;

        #[cfg(any(feature = "plugin", feature = "custom_transform"))]
        handler.with(|handler| {
            handler
                .struct_err("[React Intl] Message Descriptors require an `id` or `defaultMessage`.")
                .emit()
        });
    }

    let source_location = if let Some(location) = location {
        let (start, end) = location;

        // NOTE: this is not fully identical to babel's test snapshot output
        Some(SourceLocation {
            file: filename.to_string(),
            start: Location {
                line: start.line,
                col: start.col.to_usize(),
            },
            end: Location {
                line: end.line,
                col: end.col.to_usize(),
            },
        })
    } else {
        None
    };

    messages.push(ExtractedMessage {
        id: descriptor
            .id
            .as_ref()
            .unwrap_or(&"".to_string())
            .to_string(),
        default_message: descriptor
            .default_message
            .as_ref()
            .expect("Should be available")
            .clone(),
        description: descriptor.description.clone(),
        loc: source_location,
    });
}

fn get_message_object_from_expression(expr: Option<&mut ExprOrSpread>) -> Option<&mut Expr> {
    if let Some(expr) = expr {
        let expr = &mut *expr.expr;
        Some(expr)
    } else {
        None
    }
}

fn assert_object_expression(expr: &Option<&mut Expr>, callee: &Callee) {
    let assert_fail = match expr {
        Some(expr) => !expr.is_object(),
        _ => true,
    };

    if assert_fail {
        let prop = if let Callee::Expr(expr) = callee {
            if let Expr::Ident(ident) = &**expr {
                Some(ident.sym.to_string())
            } else {
                None
            }
        } else {
            None
        };

        #[cfg(feature = "plugin")]
        let handler = &swc_core::plugin::errors::HANDLER;

        #[cfg(feature = "custom_transform")]
        let handler = &swc_core::common::errors::HANDLER;

        #[cfg(any(feature = "plugin", feature = "custom_transform"))]
        handler.with(|handler| {
            handler
                .struct_err(
                    &(format!(
                        r#"[React Intl] `{}` must be called with an object expression
                        with values that are React Intl Message Descriptors,
                        also defined as object expressions."#,
                        prop.unwrap_or_default()
                    )),
                )
                .emit()
        });
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ExtractedMessage {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<MessageDescriptionValue>,
    pub default_message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocation {
    pub file: String,
    pub start: Location,
    pub end: Location,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Location {
    pub line: usize,
    pub col: usize,
}

pub struct FormatJSVisitor<C: Clone + Comments, S: SourceMapper> {
    // We may not need Arc in the plugin context - this is only to preserve isomorphic interface
    // between plugin & custom transform pass.
    source_map: std::sync::Arc<S>,
    comments: C,
    options: FormatJSPluginOptions,
    filename: String,
    messages: Vec<ExtractedMessage>,
    meta: HashMap<String, String>,
    component_names: HashSet<String>,
    function_names: HashSet<String>,
}

impl<C: Clone + Comments, S: SourceMapper> FormatJSVisitor<C, S> {
    fn new(
        source_map: std::sync::Arc<S>,
        comments: C,
        plugin_options: FormatJSPluginOptions,
        filename: &str,
    ) -> Self {
        let mut function_names: HashSet<String> = Default::default();
        plugin_options
            .additional_function_names
            .iter()
            .for_each(|name| {
                function_names.insert(name.to_string());
            });
        function_names.insert("formatMessage".to_string());
        function_names.insert("$formatMessage".to_string());

        let mut component_names: HashSet<String> = Default::default();
        component_names.insert("FormattedMessage".to_string());
        plugin_options
            .additional_component_names
            .iter()
            .for_each(|name| {
                component_names.insert(name.to_string());
            });

        FormatJSVisitor {
            source_map,
            comments,
            options: plugin_options,
            filename: filename.to_string(),
            messages: Default::default(),
            meta: Default::default(),
            component_names,
            function_names,
        }
    }
    fn read_pragma(&mut self, span_lo: BytePos, span_hi: BytePos) {
        let mut comments = self.comments.get_leading(span_lo).unwrap_or_default();
        comments.append(&mut self.comments.get_leading(span_hi).unwrap_or_default());

        let pragma = self.options.pragma.as_str();

        for comment in comments {
            let comment_text = &*comment.text;
            if comment_text.contains(pragma) {
                let value = comment_text.split(pragma).nth(1);
                if let Some(value) = value {
                    let value = WHITESPACE_REGEX.split(value.trim());
                    for kv in value {
                        let mut kv = kv.split(":");
                        self.meta.insert(
                            kv.next().unwrap().to_string(),
                            kv.next().unwrap().to_string(),
                        );
                    }
                }
            }
        }
    }

    fn process_message_object(&mut self, message_descriptor: &mut Option<&mut Expr>) {
        if let Some(message_obj) = &mut *message_descriptor {
            let (lo, hi) = (message_obj.span().lo, message_obj.span().hi);

            if let Expr::Object(obj) = *message_obj {
                let properties = &obj.props;

                let descriptor_path = create_message_descriptor_from_call_expr(properties);

                // If the message is already compiled, don't re-compile it
                if let Some(default_message) = &descriptor_path.default_message {
                    if default_message.is_array() {
                        return;
                    }
                }

                let descriptor = evaluate_call_expr_message_descriptor(
                    &descriptor_path,
                    &self.options,
                    &self.filename,
                );

                let source_location = if self.options.extract_source_location {
                    Some((
                        self.source_map.lookup_char_pos(lo),
                        self.source_map.lookup_char_pos(hi),
                    ))
                } else {
                    None
                };

                store_message(
                    &mut self.messages,
                    &descriptor,
                    &self.filename,
                    source_location,
                );

                let first_prop = properties.first().is_some();

                // Insert ID potentially 1st before removing nodes
                let id_prop = obj.props.iter().find(|prop| {
                    if let PropOrSpread::Prop(prop) = prop {
                        if let Prop::KeyValue(kv) = &**prop {
                            return match &kv.key {
                                PropName::Ident(ident) => &*ident.sym == "id",
                                PropName::Str(str_) => &*str_.value == "id",
                                _ => false,
                            };
                        }
                    }
                    false
                });

                if let Some(descriptor_id) = descriptor.id {
                    if let Some(id_prop) = id_prop {
                        let prop = id_prop.as_prop().unwrap();
                        let kv = &mut prop.as_key_value().unwrap();
                        kv.to_owned().value = Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: descriptor_id.into(),
                            raw: None,
                        })));
                    } else {
                        obj.props.insert(
                            0,
                            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                                key: PropName::Ident(Ident::new("id".into(), DUMMY_SP)),
                                value: Box::new(Expr::Lit(Lit::Str(Str {
                                    span: DUMMY_SP,
                                    value: descriptor_id.into(),
                                    raw: None,
                                }))),
                            }))),
                        )
                    }
                }

                let mut props = vec![];
                for prop in obj.props.drain(..) {
                    match prop {
                        PropOrSpread::Prop(mut prop) => {
                            if let Prop::KeyValue(keyvalue) = &mut *prop {
                                let key = get_message_descriptor_key_from_call_expr(&keyvalue.key);
                                if let Some(key) = key {
                                    match key {
                                        "description" => {
                                            // remove description
                                            if descriptor.description.is_some() {
                                                self.comments.take_leading(prop.span().lo);
                                            } else {
                                                props.push(PropOrSpread::Prop(prop));
                                            }
                                        }
                                        // Pre-parse or remove defaultMessage
                                        "defaultMessage" => {
                                            if self.options.remove_default_message {
                                                // remove defaultMessage
                                            } else {
                                                if let Some(descriptor_default_message) =
                                                    descriptor.default_message.as_ref()
                                                {
                                                    if self.options.ast {
                                                        let mut parser = Parser::new(
                                                            descriptor_default_message,
                                                            &ParserOptions::new(
                                                                false, false, false, false, None,
                                                            ),
                                                        );
                                                        if let Ok(parsed) = parser.parse() {
                                                            let s = serde_json::to_string(&parsed)
                                                                .unwrap();
                                                            keyvalue.value = Box::new(Expr::Lit(
                                                                Lit::Str(Str {
                                                                    span: DUMMY_SP,
                                                                    value: s.into(),
                                                                    raw: None,
                                                                }),
                                                            ));
                                                        }
                                                    } else {
                                                        keyvalue.value =
                                                            Box::new(Expr::Lit(Lit::Str(Str {
                                                                span: DUMMY_SP,
                                                                value: descriptor_default_message
                                                                    .as_str()
                                                                    .into(),
                                                                raw: None,
                                                            })));
                                                    }
                                                }

                                                props.push(PropOrSpread::Prop(prop));
                                            }
                                        }
                                        _ => props.push(PropOrSpread::Prop(prop)),
                                    }
                                } else {
                                    props.push(PropOrSpread::Prop(prop));
                                }
                            } else {
                                props.push(PropOrSpread::Prop(prop));
                            }
                        }
                        _ => props.push(prop),
                    }
                }

                obj.props = props;
            }
        }
    }
}

impl<C: Clone + Comments, S: SourceMapper> VisitMut for FormatJSVisitor<C, S> {
    noop_visit_mut_type!();

    fn visit_mut_jsx_opening_element(&mut self, jsx_opening_elem: &mut JSXOpeningElement) {
        jsx_opening_elem.visit_mut_children_with(self);

        let name = &jsx_opening_elem.name;

        if let JSXElementName::Ident(ident) = name {
            if !self.component_names.contains(&*ident.sym) {
                return;
            }
        }

        let descriptor_path = create_message_descriptor_from_jsx_attr(&jsx_opening_elem.attrs);

        // In order for a default message to be extracted when
        // declaring a JSX element, it must be done with standard
        // `key=value` attributes. But it's completely valid to
        // write `<FormattedMessage {...descriptor} />`, because it will be
        // skipped here and extracted elsewhere. The descriptor will
        // be extracted only (storeMessage) if a `defaultMessage` prop.
        if descriptor_path.default_message.is_none() {
            return;
        }

        // Evaluate the Message Descriptor values in a JSX
        // context, then store it.
        let descriptor =
            evaluate_jsx_message_descriptor(&descriptor_path, &self.options, &self.filename);

        let source_location = if self.options.extract_source_location {
            Some((
                self.source_map.lookup_char_pos(jsx_opening_elem.span().lo),
                self.source_map.lookup_char_pos(jsx_opening_elem.span().hi),
            ))
        } else {
            None
        };

        store_message(
            &mut self.messages,
            &descriptor,
            &self.filename,
            source_location,
        );

        let id_attr = jsx_opening_elem.attrs.iter().find(|attr| match attr {
            JSXAttrOrSpread::JSXAttr(attr) => {
                if let JSXAttrName::Ident(ident) = &attr.name {
                    return &*ident.sym == "id";
                } else {
                    false
                }
            }
            _ => false,
        });

        let first_attr = jsx_opening_elem.attrs.first().is_some();

        // Do not support overrideIdFn, only support idInterpolatePattern
        if descriptor.id.is_some() {
            if let Some(id_attr) = id_attr {
                if let JSXAttrOrSpread::JSXAttr(attr) = id_attr {
                    attr.to_owned().value = Some(JSXAttrValue::Lit(Lit::Str(Str::from(
                        descriptor.id.unwrap(),
                    ))));
                }
            } else if first_attr {
                jsx_opening_elem.attrs.insert(
                    0,
                    JSXAttrOrSpread::JSXAttr(JSXAttr {
                        span: DUMMY_SP,
                        name: JSXAttrName::Ident(Ident::new("id".into(), DUMMY_SP)),
                        value: Some(JSXAttrValue::Lit(Lit::Str(Str::from(
                            descriptor.id.unwrap(),
                        )))),
                    }),
                )
            }
        }

        let mut attrs = vec![];
        for attr in jsx_opening_elem.attrs.drain(..) {
            match attr {
                JSXAttrOrSpread::JSXAttr(attr) => {
                    let key = get_message_descriptor_key_from_jsx(&attr.name);
                    match key {
                        "description" => {
                            // remove description
                            if descriptor.description.is_some() {
                                self.comments.take_leading(attr.span.lo);
                            } else {
                                attrs.push(JSXAttrOrSpread::JSXAttr(attr));
                            }
                        }
                        "defaultMessage" => {
                            if self.options.remove_default_message {
                                // remove defaultMessage
                            } else {
                                /*
                                if (ast && descriptor.defaultMessage) {
                                    defaultMessageAttr
                                        .get('value')
                                        .replaceWith(t.jsxExpressionContainer(t.nullLiteral()))
                                    const valueAttr = defaultMessageAttr.get(
                                        'value'
                                    ) as NodePath<t.JSXExpressionContainer>
                                    valueAttr
                                        .get('expression')
                                        .replaceWithSourceString(
                                        JSON.stringify(parse(descriptor.defaultMessage))
                                        )
                                    }
                                 */
                                attrs.push(JSXAttrOrSpread::JSXAttr(attr))
                            }
                        }
                        _ => attrs.push(JSXAttrOrSpread::JSXAttr(attr)),
                    }
                }
                _ => attrs.push(attr),
            }
        }

        jsx_opening_elem.attrs = attrs.to_vec();

        // tag_as_extracted();
    }

    fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
        let callee = &call_expr.callee;
        let args = &mut call_expr.args;

        if let Callee::Expr(callee_expr) = callee {
            if let Expr::Ident(ident) = &**callee_expr {
                if &*ident.sym == "defineMessage" || &*ident.sym == "defineMessages" {
                    let first_arg = args.get_mut(0);
                    let mut message_obj = get_message_object_from_expression(first_arg);

                    assert_object_expression(&message_obj, callee);

                    if &*ident.sym == "defineMessage" {
                        self.process_message_object(&mut message_obj);
                    } else if let Some(obj) = message_obj {
                        if let Expr::Object(obj) = obj {
                            for prop in obj.props.iter_mut() {
                                if let PropOrSpread::Prop(prop) = &mut *prop {
                                    if let Prop::KeyValue(kv) = &mut **prop {
                                        self.process_message_object(&mut Some(&mut *kv.value));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Check that this is `intl.formatMessage` call
        if let Callee::Expr(expr) = &callee {
            let is_format_message_call = match &**expr {
                Expr::Ident(ident) if self.function_names.contains(&*ident.sym) => true,
                Expr::Member(member_expr) => {
                    if let MemberProp::Ident(ident) = &member_expr.prop {
                        self.function_names.contains(&*ident.sym)
                    } else {
                        false
                    }
                }
                _ => false,
            };

            if is_format_message_call {
                let message_descriptor = args.get_mut(0);
                if let Some(message_descriptor) = message_descriptor {
                    if message_descriptor.expr.is_object() {
                        self.process_message_object(&mut Some(message_descriptor.expr.as_mut()));
                    }
                }
            }
        }
    }

    fn visit_mut_module_items(&mut self, items: &mut Vec<ModuleItem>) {
        /*
        if self.is_instrumented_already() {
            return;
        }
        */

        for item in items {
            self.read_pragma(item.span().lo, item.span().hi);
            item.visit_mut_children_with(self);
        }

        if self.options.__debug_extracted_messages_comment {
            let messages_json_str =
                serde_json::to_string(&self.messages).expect("Should be serializable");
            let meta_json_str = serde_json::to_string(&self.meta).expect("Should be serializable");

            // Append extracted messages to the end of the file as stringified JSON comments.
            // SWC's plugin does not support to return aribitary data other than transformed codes,
            // There's no way to pass extracted messages after transform.
            // This is not a public interface; currently for debugging / testing purpose only.
            self.comments.add_trailing(
                Span::dummy_with_cmt().hi,
                Comment {
                    kind: CommentKind::Block,
                    span: Span::dummy_with_cmt(),
                    text: format!(
                        "__formatjs__messages_extracted__::{{\"messages\":{}, \"meta\":{}}}",
                        messages_json_str, meta_json_str
                    )
                    .into(),
                },
            );
        }
    }
}

pub fn create_formatjs_visitor<C: Clone + Comments, S: SourceMapper>(
    source_map: std::sync::Arc<S>,
    comments: C,
    plugin_options: FormatJSPluginOptions,
    filename: &str,
) -> FormatJSVisitor<C, S> {
    FormatJSVisitor::new(source_map, comments, plugin_options, filename)
}
