Pod::Spec.new do |s|
  s.name           = 'Pbkdf2'
  s.version        = '1.0.0'
  s.summary        = 'PBKDF2-HMAC-SHA256 for the app lock'
  s.description    = 'Hashes the app password and recovery code with CommonCrypto, off the JS thread'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
