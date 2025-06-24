export default {
  translation: {
    app: {
      barcode: {
        save: "Enregistrer",
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
              geo_point: "Position",
              crypto: "Crypto",
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
          }
        },
        barcode_form: {
          type: {
            label: "Type",
          },
          content: {
            label: "Contenu",
            placeholder: "Mon contenu",
          }
        }
      },
      qr_code: {
        save: "Enregistrer",
      },
      scanner_bottom_sheet: {
        see_website: "Voir le site web",
        open_message: "Ouvrir le message",
        share: "Partager",
        copy: "Copier le contenu du code",
        show_code: "Afficher le code",
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
