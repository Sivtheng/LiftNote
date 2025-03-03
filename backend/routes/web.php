<?php

use Illuminate\Support\Facades\Route;
require __DIR__.'/api.php';

Route::get('/', function () {
    return view('welcome');
});
