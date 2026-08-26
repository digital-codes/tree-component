<?php
// need to allow cross origin requests for this file
// as it will be called from another domain or application
header('Access-Control-Allow-Origin: *');
// must also allow the following headers for the request to be accepted
header('Access-Control-Allow-Headers: Content-Type, Authorization');
// respond to a request package with a JSON response
header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$seed = $input['seed'] ?? null;
// read json file tree_status.json from local directory. check the timestamp of the file. if the file is older than 5 seconds, return {}, else return the json object
$file = 'tree_status.json';
if (file_exists($file) && (time() - filemtime($file) <= 30)) {
    $data = json_decode(file_get_contents($file), true);
    echo json_encode($data);
} else {
    echo json_encode((object)["health" => 2, "dist" => 1]);
}



