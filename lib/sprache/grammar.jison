/* lexical analyzer */
%lex

%%

\s+                     ;
[\w-]+            return 'IDENTIFIER';
"("                     return '(';
")"                     return ')';
"["                     return '[';
"]"                     return ']';
"{"                     return '{';
"}"                     return '}';
"=="                    return '==';
"="                     return '=';
","                     return ',';
"&"                     return '&';
"|"                     return '|';
">"                     return '>';
"<"                     return '<';
<<EOF>>                 return 'EOF';

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
    : script_body EOF { $$ = $1; console.log(JSON.stringify(registry.chains)) }
    ;

script_body
    : script_body assignation {$1.push($2)}
    | assignation {$$ = [$1];}
    ;

assignation 
    : IDENTIFIER '=' chain { registry.addChain($1, $3);}
    | IDENTIFIER '=' filter {console.log('paatata');}
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
    | function_args ',' IDENTIFIER { $$ = $1; $1.push($3)}
    ;

filter
    : '{' exp '}'
    ;
    
exp
    : IDENTIFIER
    | exp '&' exp
    | exp '|' exp
    | exp '==' exp
    | exp '~=' exp
    | exp '<' exp
    | exp '>' exp
    ;