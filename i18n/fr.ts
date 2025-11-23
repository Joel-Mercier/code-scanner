export default {
  translation: {
    app: {
      home: {
        scan_code: "Scanner code",
        scan_document: "Scanner document",
      },
      document_scanner: {
        recent_documents: "Scans récents",
        folders: "Dossiers",
        add_folder: "Nouveau",
      },
      document: {
        scannedAt: "Scanné :",
        share: "Partager",
        save: "Enregistrer",
        delete: "Supprimer",
      },
      barcode: {
        save: "Enregistrer",
        share: "Partager",
      },
      history: {
        title: "Historique",
        no_history: "Aucun historique",
        delete_title: "Effacer l'historique ?",
        delete_content:
          "Cette action est irréversible et entrainera l'effacement de toutes les données de votre historique. Êtes-vous sûr de vouloir continuer ?",
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
          barcode: "Code barre",
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
              vcard: "Contact",
              contactInfo: "Contact",
              geo_point: "Position",
              geoPoint: "Position",
              crypto: "Crypto",
              event: "Événement",
              calendarEvent: "Événement",
            },
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
            },
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
            },
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
              codabar:
                "Entre 1 et 22 caractères, uniquement des chiffres et les symboles suivants + - : $ / . +",
              code128:
                "Entre 1 et 48 caractères, uniquement des caractères ASCII",
              code39:
                "Entre 1 et 30 caractères, uniquement des lettres majuscules, des chiffres, des espaces et les symboles suivants * - $ % . / +",
              datamatrix:
                "Entre 1 et 2335 caractères, uniquement des caractères ASCII",
              ean13: "Uniquement des chiffres, taille de 12 ou 13 chiffres",
              ean8: "Uniquement des chiffres, taille de 7 ou 8 chiffres",
              itf14: "Uniquement des chiffres, taille de 14 chiffres",
              pdf417:
                "Entre 1 et 2335 caractères, uniquement des caractères ASCII",
              upc_a:
                "Taille de 11 ou 12 chiffres, doit contenir au moins un zéro",
              upc_e:
                "Taille de 7 ou 8 chiffres, doit contenir au moins un zéro",
            },
          },
          fg: {
            label: "Couleur de premier plan (texte et barres)",
          },
          bg: {
            label: "Couleur d'arrière plan",
          },
          preview: {
            label: "Aperçu",
          },
          text: {
            label: "Position du texte",
            options: {
              bottom: "Bas",
              top: "Haut",
            },
          },
          height: {
            label: "Hauteur",
            placeholder: "Hauteur du code-barres en pixels",
          },
        },
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
        add_to_contacts: "Ajouter aux contacts",
        add_to_calendar: "Ajouter au calendrier",
        ssid: "Nom du réseau : ",
        password: "Mot de passe : ",
        encryption: "Sécurité : ",
        phone_number: "Numéro de téléphone : ",
        message: "Message : ",
        email: "Adresse email : ",
        subject: "Sujet : ",
        body: "Corps : ",
        first_name: "Prénom : ",
        last_name: "Nom : ",
        title: "Titre : ",
        organization: "Organisation : ",
        phone: "Téléphone : ",
        address: "Adresse : ",
        url: "Site web : ",
        summary: "Titre : ",
        location: "Localisation : ",
        description: "Description : ",
        start_date: "Date de début : ",
        end_date: "Date de fin : ",
      },
      scanner_result: {
        created: "Créé",
        scanned: "Scanné",
        ago: "il y a {{time}}",
      },
      settings: {
        title: "Paramètres",
        general: "Général",
        support: "Support & informations",
        about: "À propos",
        privacy_policy: "Politique de confidentialité",
        app_version: "Version de l'application",
        language: "Langue",
        help_faq: "Aide & FAQ",
      },
      languages: {
        title: "Langues",
        en: "Anglais",
        fr: "Français",
      },
      help_faq: {
        title: "Aide & FAQ",
        faq: "Questions fréquemment posées",
        question_1: {
          question: "Comment scanner un code QR ?",
          answer:
            "Pour scanner un code QR, vous devez avoir l'application installée sur votre appareil. Une fois installée, vous pouvez scanner un code QR en appuyant sur l'image du code QR ou en appuyant longuement sur celui-ci. Vous pouvez également scanner un code QR en ouvrant l'application et en appuyant sur l'image du code QR.",
        },
        question_2: {
          question: "Comment scanner un code-barres ?",
          answer:
            "Pour scanner un code-barres, vous devez avoir l'application installée sur votre appareil. Une fois installée, vous pouvez scanner un code-barres en appuyant sur l'image du code-barres ou en appuyant longuement sur celui-ci. Vous pouvez également scanner un code-barres en ouvrant l'application et en appuyant sur l'image du code-barres.",
        },
      },
      privacy_policy: {
        title: "Politique de confidentialité",
        edited_at: "Dernière mise à jour : Novembre 13, 2025",
        introduction_title: "1. Introduction",
        introduction_content:
          "Bienvenue sur Code Scanner (“nous”, “notre”, ou “notre site”). Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles.",
        introduction_content_2:
          "Cette politique de confidentialité explique comment notre application de code-barres et de QR (“l’application”) gère vos données dans le cadre de la Loi sur la protection des données personnelles européenne (RGPD) et d’autres lois applicables.",
        introduction_content_3:
          "Notre principe de base est simple :",
        introduction_content_4:
          "👉 Vos données restent sur votre appareil.",
        data_processing_title: "2. Traitement des données",
        data_processing_content:
          "L’application est conçue pour fonctionner entièrement localement sur votre appareil. Nous ne collectez, transmettons, ou traitons aucune donnée personnelle sur des serveurs distants.",
        data_processing_content_2: "Toutes les données de code-barres ou de QR sont stockées localement sur votre appareil jusqu’à ce que vous les supprimiez ou désinstalliez l’application.",
        data_processing_content_3:
          "Nous n’accédons à ces données et ne pouvons pas les récupérer, les afficher ou les partager.",
        data_processing_content_4:
          "Nous n’avons pas d’outils d’analyse des données et nous ne pouvons pas fournir des services de traitement de données.",
        external_service_title: "3. Génération de code-barres",
        external_service_content:
          "L’application utilise un service externe, barcodeapi.org , pour générer des code-barres. Lorsque vous demandez à générer un code-barres, l’application peut envoyer les données que vous souhaitez encoder (par exemple, un texte ou un numéro) à ce service pour générer le code-barre.",
        external_service_content_2:
          "Important : seules les données nécessaires (le texte ou le code que vous souhaitez encoder) sont transmises.",
        external_service_content_3:
          "Ces données ne sont pas identifiables personnellement sauf si vous incluez des informations personnelles dans le contenu du code-barre.",
        external_service_content_4:
          "Vous pouvez consulter la politique de confidentialité de barcodeapi.org pour obtenir des informations sur la façon dont ils traitent les données transmises.",
        legal_basis_title: "4. Base juridique pour le traitement (Article 6 du RGPD)",
        legal_basis_content:
          "Nous ne traitons pas de manière automatique toutes les données personnelles.",
        legal_basis_content_2:
          "Pour les besoins légaux limités de génération de code-barres, nous envoyons du texte à un service externe, ce qui est fait :",
        legal_basis_content_3:
          "À votre demande et pour votre propre usage, ce qui fournit la base juridique sous l’article 6(1)(a) du RGPD (demande de consentement).",
        data_retention_title: "5. Conservation des données",
        data_retention_content:
          "Nous ne conservons ni stockons de données.",
        data_retention_content_2:
          "Toutes les données générées ou analysées sont conservées uniquement sur votre appareil jusqu’à ce que vous les supprimiez ou désinstalliez l’application.",
        data_sharing_title: "6. Partage et transfert des données",
        data_sharing_content:
          "Nous ne partageons aucune donnée avec des tiers.",
        data_sharing_content_2:
          "Nous ne transférons aucune donnée à des serveurs externes sous notre contrôle.",
        data_sharing_content_3:
          "L’interaction unique externe est avec barcodeapi.org lors de la génération d’un code-barre.",
        data_transfer_title: "7. Vos droits en matière de protection des données",
        data_transfer_content:
          "Comme nous ne collectons ou n’enregistrons aucune donnée personnelle, les droits de la loi sur la protection des données (tels que l’accès aux données, la rectification ou l’effacement) ne s’appliquent pas.",
        data_transfer_content_2:
          "Cependant, vous avez toujours le droit de :",
        data_transfer_content_3:
          "Vous pouvez supprimer toutes les données stockées localement en effaçant les données de l’application ou en désinstallant l’application à tout moment.",
        security_title: "8. Sécurité",
        security_content:
          "Tout traitement se déroule localement sur votre appareil.",
        security_content_2:
          "Nous n’utilisons aucun stockage ou transmission distante, réduisant le risque de divulgation des données. Néanmoins, nous vous recommandons de ne pas encoder des informations sensibles ou personnelles dans les codes-barres ou les codes QR si la confidentialité est un préoccupation.",
        changes_title: "9. Changements de cette politique de confidentialité",
        changes_content:
          "Nous pouvons modifier cette politique de confidentialité occasionnellement pour refléter des changements fonctionnels, juridiques ou réglementaires.",
        changes_content_2:
          "La dernière version sera toujours disponible dans l’application ou sur notre site web officiel.",
        contact_us_title: "10. Contactez-nous",
        contact_us_content:
          "Si vous avez des questions ou des préoccupations concernant cette politique de confidentialité ou la protection des données, veuillez nous contacter à :",
        supervisory_authority_title: "11. Autorité supérieure",
        supervisory_authority_content:
          "Si vous êtes situés dans l’Union européenne (UE) et que vous estimez que nous traitons vos données personnelles conformément à la loi sur la protection des données personnelles européenne (RGPD), vous avez le droit de faire une demande de recours auprès de votre autorité administrative locale (DAL).",
      },
      shared: {
        yes: "Oui",
        no: "Non",
        cancel: "Annuler",
        success: "Succès",
        timeAgo: "il y a {{time}}",
        tabs: {
          home: "Scanner",
          history: "Historique",
          new_code: "Nouveau",
          settings: "Paramètres",
        }
      },
    },
  },
};
