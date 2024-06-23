package logo

import "fmt"

// PrintLogo prints an NerdyNot Logo to the console
func PrintLogo() {
	art := `
       *$$$.    .                                       
      !=  ;=   .$                =*                     
      $~   ~   =.                 $.                    
      $.                                                
      $-       ,-          -     .-                     
      ==       $$~        :$:    $$~      $             
       $$$     $$,     .  $.$    $$-      =,            
        ;$           ~=   $:=$,           :;            
        ;$          - ;   ,==-            ,*            
        ;$            *     ;             ,*            
                      ;;..-==             ;;            
                       =$$$~              $.            
                                          =             
                                           
                                  ..                    
                                 ,,                     
        :               :.,.,,,...,                     
       .-   .:;:~-::    ;~-.    .-   .:;:~-::           
       ~            ;   -..       ~          :          
       :            :  .,,.       .          ~          
       :            :  .  . .                ~          
      .,            :  .  .                  ;          
      :           ,:   .                   ,:           
      ;       ,::-.               ,    ,;:-.            
      :                 ~.      .,,                     
                        -;~-,,,,-:                      
                         .:;:~::-             
`
	fmt.Println(art)
}