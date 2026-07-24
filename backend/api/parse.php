<?php
$xml = simplexml_load_file('coverage.xml');
foreach ($xml->xpath('//file') as $file) {
    $metrics = $file->metrics;
    if ($metrics && (int)$metrics['statements'] > 0) {
        $cov = (int)$metrics['coveredstatements'] / (int)$metrics['statements'] * 100;
        if ($cov < 50) {
            echo $file['name'] . ' - ' . round($cov, 2) . '%' . PHP_EOL;
        }
    }
}
