export default {
  translation: {
    app: {
      barcode: {
        save: "Save",
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
              geo_point: "Position",
              crypto: "Crypto",
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
          }
        },
        barcode_form: {
          type: {
            label: "Type",
          },
          content: {
            label: "Content",
            placeholder: "My content",
          }
        }
      },
      qr_code: {
        save: "Save",
      },
      scanner_bottom_sheet: {
        see_website: "See website",
        open_message: "Open message",
        share: "Share",
        copy: "Copy code content",
        show_code: "Show code",
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
