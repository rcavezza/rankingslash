<?php

$return['status'] = 200;

try
{
	mail('rcavezza@gmail.com','RS|Ajax Error',print_r($_GET,true));
}
catch(Exception $e)
{
	$return['status'] = 0;
	mail('rcavezza@gmail.com','RS|exception from report_error.php',print_r($e, true));
}

echo json_encode($return);



?>