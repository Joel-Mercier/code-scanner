
export default {
  translation: {
    app: {
      home: {
        scan_code: "Scan code",
        scan_document: "Scan document",
      },
      document_scanner: {
        recent_documents: "Recent scans",
        folders: "Folders",
        add_folder: "New",
      },
      document: {
        scannedAt: "Scanned:",
        share: "Share",
        save: "Save",
        delete: "Delete",
      },
      barcode: {
        save: "Save",
        share: "Share",
      },
      history: {
        title: "Scan history",
        no_history: "No history",
        delete_title: "Delete history ?",
        delete_content:
          "This action will delete all your historical data and is irreversible. Are you sure you want to proceeed ?",
        delete_action: "Delete",
      },
      new_code: {
        title: "New code",
        generate: "Generate",
        save: "Save",
        share: "Share",
        settings: "Settings",
        tabs: {
          qr: "QR Code",
          barcode: "Barcode",
        },
        qr_code_form: {
          type: {
            label: "Type",
            options: {
              url: "Link",
              text: "Text",
              wifi: "Wifi",
              email: "Email",
              phone: "Phone",
              sms: "SMS",
              vcard: "Contact info",
              contactInfo: "Contact info",
              geo_point: "Position",
              geoPoint: "Position",
              crypto: "Crypto",
              event: "Event",
              calendarEvent: "Event",
            },
          },
          url: {
            label: "Link",
            placeholder: "https://...",
          },
          text: {
            label: "Text",
            placeholder: "My text",
          },
          ssid: {
            label: "SSID",
            placeholder: "The name of your Wifi network",
          },
          password: {
            label: "Wifi password",
            placeholder: "My Wifi password",
          },
          hidden: {
            label: "Hidden ?",
          },
          encryption: {
            label: "Encryption type",
            options: {
              none: "None",
              wpa: "WPA/WPA2",
              wep: "WEP",
            },
          },
          email: {
            label: "Email",
            placeholder: "L'adresse email du destinataire",
          },
          subject: {
            label: "Subject",
            placeholder: "Sujet de l'email",
          },
          body: {
            label: "Body",
            placeholder: "Corps du message",
          },
          cc: {
            label: "Copy address",
            placeholder: "CC",
          },
          bcc: {
            label: "Hidden copy address",
            placeholder: "BCC",
          },
          phone: {
            label: "Phone number",
            placeholder: "0612345678",
          },
          message: {
            label: "Message",
            placeholder: "Message",
          },
          first_name: {
            label: "First name",
            placeholder: "John",
          },
          last_name: {
            label: "Last name",
            placeholder: "Doe",
          },
          name: {
            label: "Name",
            placeholder: "John Doe",
          },
          vcard_email: {
            label: "Email",
            placeholder: "john.doe@gmail.com",
          },
          organization: {
            label: "Organization",
            placeholder: "Google",
          },
          title: {
            label: "Title",
            placeholder: "Developer",
          },
          address: {
            label: "Address",
            placeholder: "12 ",
          },
          website: {
            label: "Website",
            placeholder: "https://johndoe.com",
          },
          latitude: {
            label: "Latitude",
            placeholder: "46.528634",
          },
          longitude: {
            label: "Longitude",
            placeholder: "5.377266",
          },
          altitude: {
            label: "Altitude",
            placeholder: "123",
          },
          error_correction_level: {
            label: "Error correction level",
            options: {
              l: "Low (~7%)",
              m: "Medium (~15%)",
              q: "Quartile (~25%)",
              h: "High (~30%)",
            },
          },
          margin: {
            label: "Margin",
            placeholder: "Margin",
          },
          scale: {
            label: "Scale",
            placeholder: "Scale",
          },
          logo: {
            label: "Logo",
            action: "Choose",
          },
          event_title: {
            label: "Summary",
            placeholder: "Title of the event",
          },
          event_description: {
            label: "Description",
            placeholder: "Description of the event",
          },
          event_location: {
            label: "Location",
            placeholder: "Location of the event",
          },
          event_start_date: {
            label: "Start date",
            placeholder: "Start date of the event",
          },
        },
        barcode_form: {
          type: {
            label: "Type",
          },
          content: {
            label: "Content",
            placeholder: "My content",
            helpers: {
              aztec: "Only ASCII characters, at least one character long",
              codabar:
                "Between 1 and 22 characters, only digits and these symbols + - : $ / . +",
              code128: "Between 1 and 48 characters, only ASCII characters, ",
              code39:
                "Between 1 and 30 characters, only uppercase letters, digits, space and these values * - $ % . / +",
              datamatrix:
                "Between 1 and 2335 characters, only ASCII characters",
              ean13: "Only digits, must be 12 or 13 digits long",
              ean8: "Only digits, must be 7 or 8 digits long",
              itf14: "Only digits, must be 14 digits long",
              pdf417: "Between 1 and 2335 characters, only ASCII characters",
              upc_a: "Must be 11 or 12 digits, must contain at least one zero",
              upc_e: "Must be 7 or 8 digits, must contain at least one zero",
            },
          },
          fg: {
            label: "Foreground color (text and bars)",
          },
          bg: {
            label: "Background color",
          },
          preview: {
            label: "Preview",
          },
          text: {
            label: "Text position",
            options: {
              bottom: "Bottom",
              top: "Top",
            },
          },
          height: {
            label: "Height",
            placeholder: "Barcode height in pixels",
          },
        },
      },
      qr_code: {
        save: "Save",
        share: "Share",
      },
      scanner_bottom_sheet: {
        see_website: "See website",
        open_message: "Open message",
        share_content: "Share code content",
        share_code: "Share code image",
        copy: "Copy code content",
        show_code: "Show code",
        call: "Call",
        send_sms: "Send SMS",
        send_email: "Send email",
        open_map: "Open map",
        add_to_contacts: "Add to contacts",
        add_to_calendar: "Add to calendar",
        ssid: "Network name : ",
        password: "Password : ",
        encryption: "Encryption : ",
        phone_number: "Phone number : ",
        message: "Message : ",
        email: "Email : ",
        subject: "Subject : ",
        body: "Body : ",
        first_name: "First name : ",
        last_name: "Last name : ",
        title: "Title : ",
        organization: "Organization : ",
        phone: "Phone : ",
        address: "Address : ",
        url: "Website : ",
        summary: "Summary : ",
        location: "Location : ",
        description: "Description : ",
        start_date: "Start date : ",
        end_date: "End date : ",
      },
      scanner_result: {
        created: "Created",
        scanned: "Scanned",
        ago: "{{time}} ago",
      },
      settings: {
        title: "Settings",
        general: "General",
        support: "Support & information",
        about: "About",
        privacy_policy: "Privacy policy",
        app_version: "App version",
        language: "Language",
        help_faq: "Help & FAQ",
      },
      languages: {
        title: "Language",
        en: "English",
        fr: "French",
      },
      help_faq: {
        title: "Help & FAQ",
        faq: "Frenquently asked questions",
        question_1: {
          question: "How do I scan a QR code?",
          answer:
            "To scan a QR code, you need to have the app installed on your device. Once installed, you can scan a QR code by tapping on the QR code image or by long-pressing on it. You can also scan a QR code by opening the app and tapping on the QR code image.",
        },
        question_2: {
          question: "How do I scan a barcode?",
          answer:
            "To scan a barcode, you need to have the app installed on your device. Once installed, you can scan a barcode by tapping on the barcode image or by long-pressing on it. You can also scan a barcode by opening the app and tapping on the barcode image.",
        },
      },
      privacy_policy: {
        title: "Privacy policy",
        edited_at: "Last updated: November 13, 2025",
        introduction_title: "1. Introduction",
        introduction_content:
          "Welcome to Code Scanner (“we”, “our”, or “us”). We respect your privacy and are committed to protecting your personal data.",
        introduction_content_2:
          "This Privacy Policy explains how our QR code and barcode scanning app (“the App”) handles your data in compliance with the EU General Data Protection Regulation (GDPR) and other applicable privacy laws.",
        introduction_content_3:
          "Our guiding principle is simple:",
        introduction_content_4:
          "👉 Your data stays on your device.",
        data_processing_title: "2. Data We Process",
        data_processing_content:
          "The App is designed to function entirely locally on your device. We do not collect, transmit, or process any personal data on remote servers.",
        data_processing_content_2:
          "All QR code or barcode scan results, history, and generated codes are stored locally on your device.",
        data_processing_content_3:
          "We have no access to this data and cannot retrieve, view, or share it.",
        data_processing_content_4:
          "No analytics, tracking, or advertising tools are integrated into the App.",
        external_service_title: "3. External Service: Barcode Generation",
        external_service_content:
          "The App uses an external service, barcodeapi.org , to generate barcodes. When you request a barcode, the App may send the data you want to encode (e.g. a text string or number) to that API in order to generate the barcode image.",
        external_service_content_2:
          "Important notes:",
        external_service_content_3:
          "Only the minimum required data (the text or code you want encoded) is transmitted.",
        external_service_content_4:
          "This may be considered a data transfer outside your device.",
        external_service_content_5:
          "The data is not personally identifiable unless you include personal information in the barcode content itself.",
        external_service_content_6:
          "You can review barcodeapi.org’s Privacy Policy for details on how they handle any data transmitted.",
        legal_basis_title: "4. Legal Basis for Processing (Article 6 GDPR)",
        legal_basis_content:
          "We do not actively process any personal data.",
        legal_basis_content_2:
          "To the limited extent barcode generation involves sending text to an external service, this is done:",
        legal_basis_content_3:
          "At your explicit request and for your own purpose, which provides the legal basis under Article 6(1)(a) GDPR (Consent).",
        data_retention_title_2: "5. Data Retention",
        data_retention_content_2:
          "We do not retain or store any data.",
        data_retention_content_3:
          "All generated or scanned data is kept only on your device until you delete it or uninstall the App.",
        data_sharing_title: "6. Data Sharing and Transfers",
        data_sharing_content:
          "We do not share any data with third parties.",
        data_sharing_content_2:
          "We do not transfer data to any external servers under our control.",
        data_sharing_content_3:
          "The only external interaction is with barcodeapi.org when generating a barcode image.",
        data_transfer_title: "7. Your Rights Under GDPR",
        data_transfer_content:
          "As we do not collect or store any personal data, most GDPR rights (such as data access, rectification, or erasure requests) do not apply.",
        data_transfer_content_2:
          "However, you remain in full control:",
        data_transfer_content_3:
          "You can delete all locally stored data by clearing the app’s data or uninstalling it at any time.",
        security_title: "8. Security",
        security_content:
          "All processing occurs locally on your device.",
        security_content_2:
          "We use no remote storage or transmission, reducing the risk of data exposure. Nevertheless, we recommend that you do not encode sensitive or personal information in barcodes or QR codes if privacy is a concern.",
        changes_title: "9. Changes to This Privacy Policy",
        changes_content:
          "We may update this Privacy Policy occasionally to reflect functional, legal, or regulatory changes.",
        changes_content_2:
          "The latest version will always be available within the App or on our official website.",
        contact_us_title: "10. Contact Us",
        contact_us_content:
          "If you have questions or concerns about this Privacy Policy or data protection, please contact us at:",
        supervisory_authority_title: "11. Supervisory Authority",
        supervisory_authority_content:
          "If you are located in the European Economic Area (EEA) and believe we are processing your personal data in violation of the GDPR, you have the right to lodge a complaint with your local Data Protection Authority (DPA).",
      },
      shared: {
        yes: "Yes",
        no: "No",
        cancel: "Cancel",
        success: "Success",
        timeAgo: "{{time}} ago",
        tabs: {
          home: "Scanner",
          history: "History",
          new_code: "Create",
          settings: "Settings",
        }
      },
    },
  },
};
