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
        \Log::info('Attempting to delete file from Spaces', [
            'path' => $path,
            'full_url' => $path
        ]);
        
        try {
            $result = $this->disk->delete($path);
            \Log::info('File deletion result', [
                'path' => $path,
                'success' => $result
            ]);
            return $result;
        } catch (\Exception $e) {
            \Log::error('Error deleting file from Spaces', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
} 