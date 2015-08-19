<?php

$return['success']  = 200;
try
{
	mail('rcavezza@gmail.com','RS|Email',print_r($_GET,true));	
}
catch(Exception $e)
{
	$return['success'] = 0;
}

echo json_encode($return);

?>