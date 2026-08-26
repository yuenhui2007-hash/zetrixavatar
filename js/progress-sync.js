(function() {
  'use strict';

  // Cloud progress sync for authenticated users.
  // Falls back to localStorage for anonymous users.
  // Requires Firebase (v8 compat) + auth.js loaded first.

  var _db = null;
  var _syncInProgress = false;
  var _pendingWrites = [];

  function _getDb() {
    if (_db) return _db;
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      _db = firebase.firestore();
      // Enable offline persistence for Firestore
      try {
        _db.enablePersistence({ synchronizeTabs: true }).catch(function() {});
      } catch (e) {}
      return _db;
    }
    return null;
  }

  function _userId() {
    var u = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
    return u ? (u.uid || u.id) : null;
  }

  function _isFirebaseUser() {
    var u = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
    return !!(u && u.provider === 'firebase');
  }

  function _canSync() {
    return !!(_getDb() && _userId() && _isFirebaseUser());
  }

  function _localKey(courseId) {
    return 'course_' + courseId + '_progress';
  }

  function _analyticsKey(courseId) {
    return 'course_' + courseId + '_analytics';
  }

  function _getLocalProgress(courseId) {
    try {
      return JSON.parse(localStorage.getItem(_localKey(courseId))) || null;
    } catch (e) { return null; }
  }

  function _setLocalProgress(courseId, data) {
    localStorage.setItem(_localKey(courseId), JSON.stringify(data));
  }

  function _getLocalAnalytics(courseId) {
    try {
      return JSON.parse(localStorage.getItem(_analyticsKey(courseId))) || null;
    } catch (e) { return null; }
  }

  function _setLocalAnalytics(courseId, data) {
    localStorage.setItem(_analyticsKey(courseId), JSON.stringify(data));
  }

  // ========== PROGRESS SYNC ==========

  window.ProgressSync = {
    // Pull cloud progress and merge with local (cloud wins if newer)
    pullAndMerge: async function(courseId) {
      if (!courseId) return;
      if (!_canSync()) return;

      var db = _getDb();
      var uid = _userId();
      try {
        var snap = await db.collection('users').doc(uid).collection('progress').doc(courseId).get();
        var cloud = snap.exists ? snap.data() : null;
        var local = _getLocalProgress(courseId);

        if (!cloud) {
          // No cloud data yet; push local if exists
          if (local) {
            await this.push(courseId, local);
          }
          return local;
        }

        if (!local) {
          // No local data; use cloud
          _setLocalProgress(courseId, cloud);
          return cloud;
        }

        // Merge: cloud wins if newer timestamp
        var cloudTime = cloud._syncedAt || 0;
        var localTime = local._syncedAt || 0;
        if (cloudTime >= localTime) {
          _setLocalProgress(courseId, cloud);
          return cloud;
        } else {
          await this.push(courseId, local);
          return local;
        }
      } catch (err) {
        if (window.console && console.warn) console.warn('ProgressSync.pullAndMerge error', err);
        return _getLocalProgress(courseId);
      }
    },

    // Push local progress to cloud
    push: async function(courseId, data) {
      if (!courseId) return;
      if (!_canSync()) return;

      var db = _getDb();
      var uid = _userId();
      var payload = Object.assign({}, data, { _syncedAt: Date.now() });
      try {
        await db.collection('users').doc(uid).collection('progress').doc(courseId).set(payload, { merge: true });
      } catch (err) {
        if (window.console && console.warn) console.warn('ProgressSync.push error', err);
      }
    },

    // Delete cloud progress (for account cleanup)
    deleteCloud: async function(courseId) {
      if (!courseId || !_canSync()) return;
      var db = _getDb();
      var uid = _userId();
      try {
        await db.collection('users').doc(uid).collection('progress').doc(courseId).delete();
      } catch (err) {
        if (window.console && console.warn) console.warn('ProgressSync.deleteCloud error', err);
      }
    },

    // Quick check if sync is possible
    canSync: _canSync,

    // Return current user ID or null
    userId: _userId,

    // ========== ANALYTICS SYNC ==========

    pullAnalytics: async function(courseId) {
      if (!courseId || !_canSync()) return _getLocalAnalytics(courseId);
      var db = _getDb();
      var uid = _userId();
      try {
        var snap = await db.collection('users').doc(uid).collection('analytics').doc(courseId).get();
        var cloud = snap.exists ? snap.data() : null;
        var local = _getLocalAnalytics(courseId);
        if (!cloud) {
          if (local) await this.pushAnalytics(courseId, local);
          return local;
        }
        if (!local) {
          _setLocalAnalytics(courseId, cloud);
          return cloud;
        }
        var cloudTime = cloud._syncedAt || 0;
        var localTime = local._syncedAt || 0;
        if (cloudTime >= localTime) {
          _setLocalAnalytics(courseId, cloud);
          return cloud;
        } else {
          await this.pushAnalytics(courseId, local);
          return local;
        }
      } catch (err) {
        return _getLocalAnalytics(courseId);
      }
    },

    pushAnalytics: async function(courseId, data) {
      if (!courseId || !_canSync()) return;
      var db = _getDb();
      var uid = _userId();
      var payload = Object.assign({}, data, { _syncedAt: Date.now() });
      try {
        await db.collection('users').doc(uid).collection('analytics').doc(courseId).set(payload, { merge: true });
      } catch (err) {
        if (window.console && console.warn) console.warn('ProgressSync.pushAnalytics error', err);
      }
    },

    getLocalProgress: function(courseId) { return _getLocalProgress(courseId); },
    setLocalProgress: function(courseId, data) { _setLocalProgress(courseId, data); },
    getLocalAnalytics: function(courseId) { return _getLocalAnalytics(courseId); },
    setLocalAnalytics: function(courseId, data) { _setLocalAnalytics(courseId, data); }
  };
})();
