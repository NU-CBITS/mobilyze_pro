// **********************************************************
// 
// tee - A small html-snippet helper library!
// 
// Adds a single global object, t, 
// which provides a small html-snippet helper library.
// 
// Created for use in client-side javascript, 
// t writes small snippets of sugary, no-mistakes HTML.
// 
// Dependencies:
// - underscore.js
// 
// **********************************************************

//internal var for storing all html-creating functions :).
window.t = {};

// MUST BE KEPT ALPHABETICAL TO BE PROPERLY USED WITH UNDERSCORE BINARY-SEARCH ALGOS
t.SELF_CLOSING_TAGS = [
  "area", "base", "br", "col", "command", 
  "embed", "hr", "img", "input", "keygen", 
  "link", "meta", "param", "source", "track", "wbr"
];

// two underscore templates,
// one for self closing tags
// one for closing tags.
// used internally by 't'.
t.sc_template = 
  "<<%= tag %> <% _.each(atts, function(value, key) { %><%= key %>='<%= value %>' <% }); %> />";
t.ct_template = 
  "<<%= tag %> <% _.each(atts, function(value, key) { %><%= key %>='<%= value %>' <% }); %> >" +
    "<%= content %>" + 
  "</<%= tag %>>";



// tag(_tag [, content] [, attributes])
// OR
// tag(_tag [, attributes] [, content])
//  
// _tag (string): the html tag to construct.
// content (string): what is output within the tag.
// attributes (object): the html attributes of the tag as an object.
// 
// returns the html string for the html tag as specified by '_tag', 
// with the passed in set of attributes and content.
t.tag = function(_tag) { //, atts, content

  if ( arguments[1] && typeof(arguments[1]) === 'string' ) {
    content = arguments[1];
    atts = arguments[2] || {};
  } else {
    content = arguments[2] || '';
    atts = arguments[1] || {};
  };

  if (_tag) {
 
    // Not a self-closing tag 
    if (_.indexOf(t.SELF_CLOSING_TAGS, _tag, true) == -1 ) {
      return _.template(t.ct_template, {
        tag: _tag,
        atts: atts,
        content: content
      }); 
    };

    // A self-closing tag
    return _.template(t.sc_template, {
      tag: _tag,
      atts: atts
    });

  } else {
  
    return ''
  
  };

};

// *************************
// 
// HTML tag functions
// these are all convenience
// functions that delegate to t.tag
// 
// *************************

// button
t.button = function(content, attributes) {
  return t.tag('button', attributes, content);
};

// div
t.div = function(content, attributes) {
  return t.tag('div', attributes, content);
};

//link
t.link = function(label, href, attributes) {
  attributes = attributes || {};
  attributes.href = href;
  t.tag('a', attributes, label);
}

// label
// l (string): content of the label
// _for  (string): id or name of the DOM element for which this is the label. 
// returns the html for a label tag;
t.label = function(l, _for) {
  return t.tag('label', l, { for: _for });
};

// input
// convenience method which returns the html for an input tag;
// The first parameter being the label 
// for the input tag and the second parameter 
// being the complete set of html attributes for the input tag.
// Internally, hands off to the tag method.
t.input = function(attributes) {
  return t.tag('input', attributes);
};


// span
// convenience method which returns the html for a span tag;
// Internally, hands off to the tag method.
t.span = function(content, attributes) {
  return t.tag('span', content, attributes);
};


// *************************
// 
// Functions that abstract html slightly in return for syntactic sugar
// 
// *************************


//formInput
//returns the html string for:
//a single form field of type 'type';
//with an optional label tag, 'label', 
//appropriately placed before or after the input based upon its type;
//and wrapped in a div.
t.formInput = function(type, label, atts) {
  var content;
  atts = atts || {};
  atts.name = atts.name || label
  atts.type = type;
  switch (type) {
    case "text":
    case "password":
      return t.label(label, atts.name) + t.input(atts);
      break;
    case "radio":
    case "checkbox":
      return t.input(atts) + t.label(label, atts.name);
      break;
    case "option":
      return t.tag('option', atts, label);
      break;
    case "textarea":
      content = atts.value;
      delete atts.value;
      return t.label(label, atts.name) + t.div(t.tag('textarea', atts, content));
      break;
    default:
      return t.span("UNIMPLEMENTED FORM INPUT TYPE '" + type + "'", atts);
  };
};