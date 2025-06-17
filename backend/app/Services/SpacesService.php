<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SpacesService
{
    protected $disk;

    public function __construct()
    {
        $this->disk = Storage::disk('spaces');
    }

    public function uploadFile(UploadedFile $file, string $directory = 'uploads'): string
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $directory . '/' . $filename;
        
        $this->disk->put($path, file_get_contents($file), 'public');
        
        return $this->disk->url($path);
    }

    public function deleteFile(string $path): bool
    {
        return $this->disk->delete($path);
    }
} 