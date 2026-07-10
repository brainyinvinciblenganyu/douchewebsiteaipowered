<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!isset($_FILES['image'])) {
    echo json_encode(['error' => 'No image uploaded']);
    exit;
}

// 1. Configuration
$hfToken = "your_hugging_face_token_here"; // Replace with your free token
/**
 * Using openai/shap-e for 3D generation. 
 * Note: This model returns raw GLB binary data.
 * For higher quality, consider 'stabilityai/stable-point-aware-3d'
 */
$modelUrl = "https://api-inference.huggingface.co/models/openai/shap-e"; // Open source 3D model

// 2. Prepare the image
$imagePath = $_FILES['image']['tmp_name'];
$imageData = file_get_contents($imagePath);

// 3. Call Hugging Face API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $modelUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $imageData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $hfToken",
    "Content-Type: application/octet-stream"
]);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Check if directory exists, if not create it
$uploadDir = '../public/models/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($httpCode === 200) {
    // In a real scenario, the API returns a GLB file or a link.
    // For Shap-E, it often returns the binary data of the model.
    // We save it locally in XAMPP
    $modelFilename = 'model_' . time() . '.glb';
    $savePath = '../public/models/' . $modelFilename;
    $savePath = $uploadDir . $modelFilename;
    
    if (!is_dir('../public/models/')) {
        mkdir('../public/models/', 0777, true);
    }
    
    file_put_contents($savePath, $result);

    // 4. Mock Recommendations (In production, query your MySQL DB here)
    // Example: SELECT * FROM products WHERE category = 'detected_category'
    $recommendations = [
        [
            "id" => "101",
            "name" => "Handcrafted Wooden Base",
            "price" => "FCFA 25,000",
            "image" => "https://images.unsplash.com/photo-1581404476143-fb31d742929f?w=200"
        ],
        [
            "id" => "102",
            "name" => "Polished Finish Spray",
            "price" => "FCFA 5,000",
            "image" => "https://images.unsplash.com/photo-1585333127302-d278996629e9?w=200"
        ]
    ];

    // 4. Recommendation Logic
    // This simulates querying your MySQL database for products that match the AI generation
    $mockProductDb = [
        ["id" => "1", "name" => "Handcrafted Stool", "price" => "FCFA 35,000", "image" => "https://images.unsplash.com/photo-1503602642458-232111445657?w=200"],
        ["id" => "2", "name" => "Tribal Art Vase", "price" => "FCFA 15,000", "image" => "https://images.unsplash.com/photo-1581404476143-fb31d742929f?w=200"],
        ["id" => "3", "name" => "Modern Wood Lamp", "price" => "FCFA 45,000", "image" => "https://images.unsplash.com/photo-1507473885765-e6ed657f997a?w=200"],
        ["id" => "4", "name" => "African Print Pillow", "price" => "FCFA 12,000", "image" => "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=200"]
    ];

    // Randomly pick 3 products to recommend
    shuffle($mockProductDb);
    $recommendations = array_slice($mockProductDb, 0, 3);

    echo json_encode([
        'modelUrl' => 'http://localhost/douche/backend/public/models/' . $modelFilename,
        'status' => 'success',
        'recommendations' => $recommendations
    ]);
} elseif ($httpCode === 503) {
    // Hugging Face sometimes returns 503 if the model is still loading
    $recommendations = [
        ["id" => "99", "name" => "AI Processing...", "price" => "Varying", "image" => ""]
    ];
    echo json_encode(['error' => 'AI model is warming up. Please try again in 30 seconds.', 'status' => 'loading']);
} else {
    echo json_encode([
        'error' => 'AI Generation failed',
        'debug' => $result
    ]);
}
?>