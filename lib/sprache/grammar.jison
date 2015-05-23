/* lexical analyzer */
%lex

%%

\s+                         ; //We ignore spaces
\/\*.*\*\/                  ; //We ignore comments
(\d{1,3}"."){3}\d{1,3}      return 'IPADDR'; //To match IP addresses
\/.*\/                      return 'REGEXP'; //regular expressions
\w+\|[\w-]+                 return 'OBJECT_PROP'; //To match word or object|prop
[A-Za-z][\w-]+              return 'NAME'; //To match word or object|prop
"("                         return '(';
")"                         return ')';
"["                         return '[';
"]"                         return ']';
"{"                         return '{';
"}"                         return '}';
"=="                        return '==';
"~="                        return '~=';
"="                         return '=';
","                         return ',';
"&"                         return '&';
"|"                         return '|';
">"                         return '>';
"<"                         return '<';
<<EOF>>                     return 'EOF';

/lex

%left '==' '~=' '>' '<'
%left '|'
%left '&'

%start script 

%{
var sprache = require('./sprache');
var registry = require('../registry');

function checkUndefined(obj, type, name) {
    if (obj === undefined) {
        throw new ReferenceError('Unknown ' + type + ': ' + name);
    }
    return obj;
}

%}

%%
VALUE
    : REGEXP 
    | IPADDR
    | NAME
    | OBJECT_PROP
    ;

script
    : script_body EOF { $$ = $1 }
    ;

script_body
    : script_body line {$1.push($2);}
    | line {$$ = [$1];} 
    ;
    
line 
    : assignation
    ;

assignation 
    : NAME '=' chain { registry.addChain($1, $3); }
    | NAME '=' filter { registry.addFilter($1, $3); }
    ;

chain
    : '[' chain_body ']' { $$ = $2; }
    ;

chain_body
    : chain_body_element { $$ = new sprache.Chain(); $$.addElement($1); }
    | chain_body chain_body_element { $$ = $1; $1.addElement($2); }
    ;

chain_body_element
    : function_call 
    | filter 
    | chain 
    ;
    
function_call 
    : NAME  { $$ = new sprache.FunctionCall(checkUndefined(registry.getFunction($1), 'function', $1)) ; }
    | NAME '(' function_args ')' { 
        $$ = new sprache.FunctionCall(checkUndefined(registry.getFunction($1),'function', $1), $3); 
    }
    ;
    
function_args
    : function_arg {$$ = [$1]}
    | function_args ',' function_arg { $$ = $1; $1.push($3)}
    ;
    
function_arg
    : VALUE 
    | chain
    | filter
    ;

filter
    : '{' exp '}' { $$ = new sprache.Filter($2); }
    ;

cmp
    : VALUE '==' VALUE { $$ = new sprache.Expression($1, $2, $3); }
    | VALUE '~=' REGEXP { $$ = new sprache.Expression($1, $2, $3); }
    | VALUE '<' VALUE { $$ = new sprache.Expression($1, $2, $3); }
    | VALUE '>' VALUE { $$ = new sprache.Expression($1, $2, $3); }
    ;

exp
    : exp '&' exp { $$ = new sprache.Expression($1, $2, $3); }
    | exp '|' exp { $$ = new sprache.Expression($1, $2, $3); }
    | '(' exp ')' { $$ = $2; }
    | cmp
    ;
