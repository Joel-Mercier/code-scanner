
export default {
  translation: {
    app: {
      barcode: {
        save: "Save",
        share: "Share",
      },
      history: {
        title: "History",
        no_history: "No history",
        delete_title: "Delete history ?",
        delete_content: "This action will delete all your historical data and is irreversible. Are you sure you want to proceeed ?",
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
          barcode: "Barcode"
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
              vcard: "vCard",
              geoPoint: "Position",
              crypto: "Crypto",
              event: "Event",
            }
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
            }
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
            }
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
              codabar: "Between 1 and 22 characters, only digits and these symbols + - : $ / . +",
              code128: "Between 1 and 48 characters, only ASCII characters, ",
              code39: "Between 1 and 30 characters, only uppercase letters, digits, space and these values * - $ % . / +",
              datamatrix: "Between 1 and 2335 characters, only ASCII characters",
              ean13: "Only digits, must be 12 or 13 digits long",
              ean8: "Only digits, must be 7 or 8 digits long",
              itf14: "Only digits, must be 14 digits long",
              pdf417: "Between 1 and 2335 characters, only ASCII characters",
              upc_a: "Must be 11 or 12 digits, must contain at least one zero",
              upc_e: "Must be 7 or 8 digits, must contain at least one zero"
            }
          },
          fg: {
            label: "Foreground color (text and bars)",
          },
          bg: {
            label: "Background color",
          },
          text: {
            label: "Text position",
            options: {
              bottom: "Bottom",
              top: "Top"
            }
          },
          height: {
            label: "Height",
            placeholder: "Barcode height in pixels"
          }
        }
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
      },
      scanner_result: {
        created: "Created",
        scanned: "Scanned",
        ago: "{{time}} ago",
      },
      settings: {
        title: "Settings",
        form: {
          language: {
            label: "Language",
            options: {
              en: "English",
              fr: "French"
            }
          }
        }
      },
      shared: {
        yes: "Yes",
        no: "No",
        cancel: "Cancel",
        success: "Success",
      }
    }
  }
}
