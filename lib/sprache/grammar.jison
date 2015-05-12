/* lexical analyzer */
%lex

%%

\s+                         ; //We ignore spaces
\/\*.*\*\/                  ; //We ignore comments
(\d{1,3}"."){3}\d{1,3}    return 'IDENTIFIER'; //To match IP addresses
\/.*\/                      return 'IDENTIFIER'; //regular expressions
\w+\|[\w-]+|[\w-]+          return 'IDENTIFIER'; //To match word or object|prop
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
%}

%%
script
    : script_body EOF { $$ = $1 }
    ;

script_body
    : script_body assignation {$1.push($2);}
    | assignation {$$ = [$1];}
    ;

assignation 
    : IDENTIFIER '=' chain { registry.addChain($1, $3);}
    | IDENTIFIER '=' filter { registry.addFilter($1, $3);}
    ;

chain
    : '[' chain_body ']' { $$ = $2; }
    ;

chain_body
    : chain_body_element { $$ = new sprache.Chain(); $$.addElement($1); }
    | chain_body chain_body_element { $$ = $1; $1.addElement($2); }
    ;

chain_body_element
    : function_call { $$ = $1; }
    | filter {$$ = $1; }
    | chain { $$ = $1; }
    ;
    
function_call 
    : IDENTIFIER  {$$ = new sprache.FunctionCall(registry.getFunction($1)); }
    | IDENTIFIER '(' function_args ')' { 
        $$ = new sprache.FunctionCall(registry.getFunction($1), $3); 
    }
    ;
    
function_args
    : IDENTIFIER { $$ = [$1]; }
    | chain
    | filter
    | function_args ',' IDENTIFIER { $$ = $1; $1.push($3)}
    ;

filter
    : '{' exp '}'
    ;

cmp
    : IDENTIFIER '==' IDENTIFIER { $$ = sprache.Expression($1, $2, $3); }
    | IDENTIFIER '~=' IDENTIFIER { $$ = sprache.Expression($1, $2, $3); }
    | IDENTIFIER '<' IDENTIFIER { $$ = sprache.Expression($1, $2, $3); }
    | IDENTIFIER '>' IDENTIFIER { $$ = sprache.Expression($1, $2, $3); }
    ;

exp
    : exp '&' exp { $$ = sprache.Expression($1, $2, $3); }
    | exp '|' exp { $$ = sprache.Expression($1, $2, $3); }
    | '(' exp ')' { $$ = $2; }
    | cmp
    ;