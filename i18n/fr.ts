export default {
  translation: {
    app: {
      barcode: {
        save: "Enregistrer",
        share: "Partager",
      },
      history: {
        title: "Historique",
        no_history: "Aucun historique",
        delete_title: "Effacer l'historique ?",
        delete_content: "Cette action est irréversible et entrainera l'effacement de toutes les données de votre historique. Êtes-vous sûr de vouloir continuer ?",
        delete_action: "Effacer",
      },
      new_code: {
        title: "Nouveau code",
        generate: "Générer",
        save: "Enregistrer",
        share: "Partager",
        settings: "Paramètres",
        tabs: {
          qr: "Code QR",
          barcode: "Code barre"
        },
        qr_code_form: {
          type: {
            label: "Type",
            options: {
              url: "Lien",
              text: "Texte",
              wifi: "Wifi",
              email: "Email",
              phone: "Téléphone",
              sms: "SMS",
              vcard: "vCard",
              geoPoint: "Position",
              crypto: "Crypto",
              event: "Événement",
            }
          },
          url: {
            label: "Lien",
            placeholder: "https://...",
          },
          text: {
            label: "Texte",
            placeholder: "Mon texte",
          },
          ssid: {
            label: "SSID",
            placeholder: "Le nom de votre réseau Wifi",
          },
          password: {
            label: "Mot de passe Wifi",
            placeholder: "Mon mot de passe Wifi",
          },
          hidden: {
            label: "Réseau Wifi caché ?",
          },
          encryption: {
            label: "Type de sécurité réseau",
            options: {
              none: "Aucune",
              wpa: "WPA/WPA2",
              wep: "WEP",
            }
          },
          email: {
            label: "Email",
            placeholder: "L'adresse email du destinataire",
          },
          subject: {
            label: "Sujet",
            placeholder: "Sujet de l'email",
          },
          body: {
            label: "Corps du message",
            placeholder: "Corps du message",
          },
          cc: {
            label: "Adresse en copie",
            placeholder: "CC",
          },
          bcc: {
            label: "Adresse en copie cachée",
            placeholder: "BCC",
          },
          phone: {
            label: "Numéro de téléphone",
            placeholder: "0612345678",
          },
          message: {
            label: "Message",
            placeholder: "Message",
          },
          first_name: {
            label: "Prénom",
            placeholder: "Jean",
          },
          last_name: {
            label: "Nom",
            placeholder: "Dupont",
          },
          name: {
            label: "Nom",
            placeholder: "Jean Dupont",
          },
          vcard_email: {
            label: "Email",
            placeholder: "jean.dupont@gmail.com",
          },
          organization: {
            label: "Organisation",
            placeholder: "Google",
          },
          title: {
            label: "Titre",
            placeholder: "Développeur",
          },
          address: {
            label: "Adresse",
            placeholder: "12 rue de la gare",
          },
          website: {
            label: "Site web",
            placeholder: "https://jeandupont.com",
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
            label: "Niveau de correction d'erreur",
            options: {
              l: "Bas (~7%)",
              m: "Moyen (~15%)",
              q: "Quartile (~25%)",
              h: "Haut (~30%)",
            }
          },
          margin: {
            label: "Marges",
            placeholder: "Marge",
          },
          scale: {
            label: "Echelle",
            placeholder: "Echelle",
          },
          logo: {
            label: "Logo",
            action: "Choisir",
          },
          event_title: {
            label: "Titre",
            placeholder: "Titre de l'événement",
          },
          event_description: {
            label: "Description",
            placeholder: "Description de l'événement",
          },
          event_location: {
            label: "Lieu",
            placeholder: "Lieu de l'événement",
          },
          event_start_date: {
            label: "Date de début",
            placeholder: "Date de début de l'événement",
          },
        },
        barcode_form: {
          type: {
            label: "Type",
          },
          content: {
            label: "Contenu",
            placeholder: "Mon contenu",
            helpers: {
              aztec: "Uniquement des caractères ASCII, au moins 1 caractère",
              codabar: "Entre 1 et 22 caractères, uniquement des chiffres et les symboles suivants + - : $ / . +",
              code128: "Entre 1 et 48 caractères, uniquement des caractères ASCII",
              code39: "Entre 1 et 30 caractères, uniquement des lettres majuscules, des chiffres, des espaces et les symboles suivants * - $ % . / +",
              datamatrix: "Entre 1 et 2335 caractères, uniquement des caractères ASCII",
              ean13: "Uniquement des chiffres, taille de 12 ou 13 chiffres",
              ean8: "Uniquement des chiffres, taille de 7 ou 8 chiffres",
              itf14: "Uniquement des chiffres, taille de 14 chiffres",
              pdf417: "Entre 1 et 2335 caractères, uniquement des caractères ASCII",
              upc_a: "Taille de 11 ou 12 chiffres, doit contenir au moins un zéro",
              upc_e: "Taille de 7 ou 8 chiffres, doit contenir au moins un zéro"
            }
          },
          fg: {
            label: "Couleur de premier plan (texte et barres)",
          },
          bg: {
            label: "Couleur d'arrière plan",
          },
          text: {
            label: "Position du texte",
            options: {
              bottom: "Bas",
              top: "Haut"
            }
          },
          height: {
            label: "Hauteur",
            placeholder: "Hauteur du code-barres en pixels"
          }
        }
      },
      qr_code: {
        save: "Enregistrer",
        share: "Partager",
      },
      scanner_bottom_sheet: {
        see_website: "Voir le site web",
        open_message: "Ouvrir le message",
        share_content: "Partager le contenu du code",
        share_code: "Partager l'image du code",
        copy: "Copier le contenu du code",
        show_code: "Afficher le code",
        call: "Appeler",
        send_sms: "Envoyer un SMS",
        send_email: "Envoyer un email",
        open_map: "Ouvrir la carte",
      },
      scanner_result: {
        created: "Créé",
        scanned: "Scanné",
        ago: "il y a {{time}}",
      },
      settings: {
        title: "Paramètres",
        form: {
          language: {
            label: "Langue",
            options: {
              en: "Anglais",
              fr: "Français"
            }
          }
        }
      },
      shared: {
        yes: "Oui",
        no: "Non",
        cancel: "Annuler",
        success: "Succès",
      }
    }
  }
}
