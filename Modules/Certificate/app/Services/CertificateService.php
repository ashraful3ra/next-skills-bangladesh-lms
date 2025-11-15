<?php

namespace Modules\Certificate\Services;

use App\Services\MediaService;
use Modules\Certificate\Models\CertificateTemplate;

class CertificateService extends MediaService
{
   function createCertificateTemplate(array $data): CertificateTemplate
   {
      $template = CertificateTemplate::create($data);

      if (array_key_exists('logo', $data) && $data['logo']) {
         $template->update([
            'logo_path' => $this->addNewDeletePrev($template, $data['logo'], 'certificates_logo')
         ]);
      }

      return $template;
   }

   function updateCertificateTemplate(string $id, array $data): CertificateTemplate
   {
      $template = CertificateTemplate::findOrFail($id);

      if (array_key_exists('logo', $data) && $data['logo']) {
         $template->update([
            'logo_path' => $this->addNewDeletePrev($template, $data['logo'], 'certificates_logo')
         ]);
      }

      return $template;
   }

   function activateCertificateTemplate(string $id): void
   {
      $template = CertificateTemplate::findOrFail($id);

      CertificateTemplate::where('id', '!=', $id)->update(['is_active' => false]);

      $template->update(['is_active' => true]);
   }

   function deleteCertificateTemplate(string $id): void
   {
      CertificateTemplate::findOrFail($id)->delete();
   }
}
