const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const COLL_CURRENT = 'stranger-phoning-team-v2';
const COLL_HISTORY = 'stranger-phoning-history';
const COLL_CHAT = 'strangers-phoning-chat-global';

const CONFIGS = {
    ADN: 'strangers-phoning-event-final',
    CALL: 'stranger-phoning-mada'
};

/**
 * Fonction d'archivage pour une équipe
 */
async function archiveTeam(appId) {
    try {
        const todayLabel = new Date().toLocaleDateString('fr-FR');

        // Récupérer tous les joueurs actuels
        const playersSnap = await db
            .collection('artifacts')
            .doc(appId)
            .collection('public')
            .doc('data')
            .collection(COLL_CURRENT)
            .get();

        const playersToArchive = playersSnap.docs.map(doc => doc.data());

        // Ne pas archiver s'il n'y a pas de joueurs
        if (playersToArchive.length === 0) {
            console.log(`[${appId}] Aucun joueur à archiver`);
            return { success: true, message: 'Pas de données à archiver' };
        }

        // Créer l'archive
        await db
            .collection('artifacts')
            .doc(appId)
            .collection('public')
            .doc('data')
            .collection(COLL_HISTORY)
            .add({
                dateLabel: todayLabel,
                archivedAt: Date.now(),
                players: playersToArchive,
                autoArchive: true,
                archivedBy: 'cloud-function'
            });

        // Réinitialiser les stats des joueurs
        const batch = db.batch();
        playersSnap.docs.forEach(docSnap => {
            batch.update(docSnap.ref, {
                calls: 0,
                rdvs: 0,
                powersUsed: 0
            });
        });

        // Supprimer les messages du chat
        const chatSnap = await db
            .collection('artifacts')
            .doc(appId)
            .collection('public')
            .doc('data')
            .collection(COLL_CHAT)
            .get();

        chatSnap.docs.forEach(docSnap => {
            batch.delete(docSnap.ref);
        });

        await batch.commit();

        console.log(`[${appId}] Archivage réussi - ${playersToArchive.length} joueurs archivés`);
        return { success: true, playersArchived: playersToArchive.length };

    } catch (error) {
        console.error(`[${appId}] Erreur d'archivage:`, error);
        throw error;
    }
}

/**
 * Cloud Function planifiée - S'exécute tous les jours à 18H30 (Europe/Paris)
 * Format cron: minute heure jour mois jour-de-semaine
 * 30 18 * * * = à 18H30 tous les jours
 */
exports.dailyArchive = functions
    .region('europe-west1')
    .pubsub
    .schedule('30 18 * * *')
    .timeZone('Europe/Paris')
    .onRun(async (context) => {
        console.log('=== DÉBUT ARCHIVAGE AUTOMATIQUE ===');
        console.log('Heure:', new Date().toLocaleString('fr-FR'));

        const results = {
            timestamp: Date.now(),
            teams: {}
        };

        try {
            // Archiver l'équipe ADN
            const adnResult = await archiveTeam(CONFIGS.ADN);
            results.teams.ADN = adnResult;

            // Archiver l'équipe CALL
            const callResult = await archiveTeam(CONFIGS.CALL);
            results.teams.CALL = callResult;

            console.log('=== ARCHIVAGE TERMINÉ ===');
            console.log('Résultats:', JSON.stringify(results, null, 2));

            return results;

        } catch (error) {
            console.error('=== ERREUR ARCHIVAGE ===', error);
            throw new functions.https.HttpsError('internal', 'Erreur lors de l\'archivage', error);
        }
    });

/**
 * Fonction HTTP pour tester manuellement l'archivage
 * Appel: https://REGION-PROJECT_ID.cloudfunctions.net/manualArchive
 */
exports.manualArchive = functions
    .region('europe-west1')
    .https
    .onRequest(async (req, res) => {
        console.log('=== ARCHIVAGE MANUEL DÉCLENCHÉ ===');

        try {
            const results = {
                timestamp: Date.now(),
                teams: {}
            };

            const adnResult = await archiveTeam(CONFIGS.ADN);
            results.teams.ADN = adnResult;

            const callResult = await archiveTeam(CONFIGS.CALL);
            results.teams.CALL = callResult;

            res.status(200).json({
                success: true,
                message: 'Archivage manuel réussi',
                results
            });

        } catch (error) {
            console.error('Erreur archivage manuel:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
