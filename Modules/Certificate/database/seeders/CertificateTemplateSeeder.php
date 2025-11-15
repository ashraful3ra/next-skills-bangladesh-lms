<?php

namespace Modules\Certificate\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Certificate\Models\CertificateTemplate;

class CertificateTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Template 1: Professional Blue (Modern Corporate)
        CertificateTemplate::firstOrCreate(
            ['name' => 'Professional Blue'],
            [
                'logo_path' => null,
                'template_data' => [
                    'primaryColor' => '#1e40af',
                    'secondaryColor' => '#475569',
                    'backgroundColor' => '#eff6ff',
                    'borderColor' => '#2563eb',
                    'titleText' => 'Certificate of Achievement',
                    'descriptionText' => 'This certificate is proudly presented to',
                    'completionText' => 'for successfully completing the course',
                    'footerText' => 'Authorized and Certified',
                    'fontFamily' => 'sans-serif',
                ],
                'is_active' => true,
            ]
        );

        // Template 2: Elegant Green (Success & Growth)
        CertificateTemplate::firstOrCreate(
            ['name' => 'Elegant Green'],
            [
                'logo_path' => null,
                'template_data' => [
                    'primaryColor' => '#047857',
                    'secondaryColor' => '#1f2937',
                    'backgroundColor' => '#d1fae5',
                    'borderColor' => '#10b981',
                    'titleText' => 'Certificate of Excellence',
                    'descriptionText' => 'This is to certify that',
                    'completionText' => 'has demonstrated outstanding achievement in',
                    'footerText' => 'Congratulations on your accomplishment',
                    'fontFamily' => 'serif',
                ],
                'is_active' => true,
            ]
        );

        // Template 3: Royal Purple (Premium & Luxurious)
        CertificateTemplate::firstOrCreate(
            ['name' => 'Royal Purple'],
            [
                'logo_path' => null,
                'template_data' => [
                    'primaryColor' => '#6b21a8',
                    'secondaryColor' => '#374151',
                    'backgroundColor' => '#fae8ff',
                    'borderColor' => '#c026d3',
                    'titleText' => 'Certificate of Completion',
                    'descriptionText' => 'This prestigious certificate is awarded to',
                    'completionText' => 'for exceptional dedication and successful completion of',
                    'footerText' => 'Excellence in Learning',
                    'fontFamily' => 'cursive',
                ],
                'is_active' => false,
            ]
        );
    }
}
