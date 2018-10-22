sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageToast",
	"com/axians/itsolutions/ui5/nmsmp/utils/commonUtils/Logger",
	"com/sap/build/axians/novofermMobil/utils/Const"
], function(BaseObject, MessageToast, Logger, Const) {
	"use strict";

	var OfflineDatabaseHelper = BaseObject.extend("com.sap.build.axians.novofermMobil.utils.helper.OfflineDatabaseHelper", {

		constants: Const,
		_oOwnerComponent: undefined,
		_oDataBases: undefined,

		metadata: {
			publicMethods: [
				"openDB",
				"closeDB",
				"deleteDB",
				"clearObjectStore",
				"addEntry",
				"addEntries",
				"removeEntry",
				"getEntry",
				"getEntries"
			],
			privateMethods: [
				"_handleRequestError",
				"_handleDBClose",
				"_handleTransactionAborted",
				"_initIndexDBConstants",
				"_initDBErrorEventHandler"
			]
		},

		/* ========================================================================================================== */
		// Livecycle Functions
		/* ========================================================================================================== */

		constructor: function(oOwnerComponent) {
			this._oOwnerComponent = oOwnerComponent;
		},

		/**
		 * Tries to open the indexDB. If not exists, tries to create db and its object-stores.
		 * @returns {Promise<any>}
		 */
		openDB: function() {
			return new Promise(function(fResolve, fReject) {
				if (this._initIndexDBConstants()) {
					Logger.info("OfflineDatabaseHelper.openDB: initialize offline-database - opening indexDB");
					this._oDataBases = {};
					var oManifest = this._oOwnerComponent.getManifestObject().getJson();
					var sDBName = oManifest["sap.app"].offline_database.name;
					var lDBVersion = oManifest["sap.app"].offline_database.version;
					var aPromises = [
						this._openDB(sDBName, this.constants.offline_database.nameSuffices.A, lDBVersion),
						this._openDB(sDBName, this.constants.offline_database.nameSuffices.B, lDBVersion),
					];
					Logger.info("OfflineDatabaseHelper.openDB: initialize offline-databases A and B");
					Promise.all(aPromises).then(function(aResults) {
						Logger.info("OfflineDatabaseHelper.openDB: initialize offline-databases A and B success");
						fResolve();
					}.bind(this), function(reason) {
						Logger.error("OfflineDatabaseHelper.openDB: initialize offline-databases A and B failed");
						fReject(reason);
					}.bind(this));
				} else {
					fReject("No instance of indexDB found!");
				}
			}.bind(this));
		},

		_openDB: function(sDBName, sSuffix, lDBVersion) {
			return new Promise(function(fResolve, fReject) {
				sDBName = sDBName + sSuffix;
				Logger.info("OfflineDatabaseHelper._openDB: initialize offline-database - opening indexDB: " + sDBName + " version-" +
					lDBVersion);
				var oOpenRequest = window.indexedDB.open(sDBName, lDBVersion);
				var that = this;
				oOpenRequest.onsuccess = function(oEvent) {
					that._oDataBases[sSuffix] = oEvent.target.result;
					that._initDBErrorEventHandler.bind(that)(that._oDataBases[sSuffix], fReject);
					Logger.info("OfflineDatabaseHelper._openDB: offline-database opened!");
					fResolve();
				};
				oOpenRequest.onerror = this._handleRequestError.bind({
					errorMsg: "Failed to open database '" + sDBName + "'!",
					fCallback: fReject
				});

				// This event handles the event whereby a new version of
				// the database needs to be created Either one has not
				// been created before, or a new version number has been
				// submitted via the window.indexedDB.open
				// it is only implemented in recent browsers
				oOpenRequest.onupgradeneeded = function(oEvent1) {
					Logger.info("OfflineDatabaseHelper._openDB: offline-database upgrade needed, creating object-stores and indices!");

					var oDataBase = this.result;
					that._initDBErrorEventHandler.bind(that)(oDataBase, fReject);

					//// Create objectStores ////
					// customer-orders
					var oCustomerOrdersObjectStore = oDataBase.createObjectStore(Const.offline_database.object_store_names.CUSTOMER_ORDERS, {
						keyPath: ["Backend", "OrderId"]
					});
					oCustomerOrdersObjectStore.createIndex("CustomerOrder", ["Backend", "OrderId"], {
						unique: true
					});
					// order-position-confirmations
					var oOrderPosConfirmationsObjectStore = oDataBase.createObjectStore(Const.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS, {
						keyPath: ["Backend", "OrderId", "OrderPositionNo", "OrderPositionOperationNo", "EquipmentId"]
					});
					oOrderPosConfirmationsObjectStore.createIndex("OrderPositionConfirmations", ["Backend", "OrderId", "OrderPositionNo",
						"OrderPositionOperationNo", "EquipmentId"
					], {
						unique: true
					});
					// equi-to-orders
					var oEquiToOrdersObjectStore = oDataBase.createObjectStore(Const.offline_database.object_store_names.EQUI_TO_ORDER, {
						keyPath: ["Backend", "EquipmentId"]
					});
					oEquiToOrdersObjectStore.createIndex("EquiToOrder", ["Backend", "EquipmentId"], {
						unique: true
					});
					// equipments
					var oEquipmentsObjectStore = oDataBase.createObjectStore(Const.offline_database.object_store_names.EQUIPMENTS, {
						keyPath: ["Backend", "EquipmentId"]
					});
					oEquipmentsObjectStore.createIndex("Equipments", ["Backend", "EquipmentId"], {
						unique: true
					});
				};
			}.bind(this));
		},

		/**
		 * Synchronous call. Closes database if opened.
		 */
		closeDB: function() {
			if (this._oDataBases) {
				var aDBs = Object.values(this._oDataBases);
				for (var i in aDBs) {
					aDBs[i].close();
				}
				// indicate that db is closed
				this._oDataBases = undefined;
			}
		},

		deleteDB: function() {
			return new Promise(function(fResolve, fReject) {
				this.closeDB();
				if (this._oDataBases) {
					var aDBs = Object.values(this._oDataBases);
					for (var i in aDBs) {
						var sDBName = aDBs[i].name;
						Logger.info("OfflineDatabaseHelper: start deleting database '" + sDBName + "'");
						var oDeletionRequest = window.indexedDB.deleteDatabase(sDBName);
						oDeletionRequest.onsuccess = function(oEvent) {
							Logger.info("OfflineDatabaseHelper: successful deleted database '" + sDBName + "'");
							fResolve();
						};
						oDeletionRequest.onerror = function(oEvent) {
							fReject("OfflineDatabaseHelper: failed to delete database '" + sDBName + "'! Error: " + oEvent.target.error.message);
						};
					}
				}
			}.bind(this));
		},

		/* ========================================================================================================== */
		// Functions
		/* ========================================================================================================== */

		/**
		 * Tries to remove all entries from all object-stores.
		 * @param {String} sSuffix indicates the database to be affected; optional, must be one of these: /utils/Const.offline_database.nameSuffices; when undefined, current suffix will be read from local storage
		 * @returns {Promise<any>} rejects, if the database is not opened or any other error occurs. In this case the db remains unchanged!
		 */
		clearAllObjectStores: function(sSuffix) {
			return new Promise(function(fResolve, fReject) {
				var aPromises = [
					this.clearObjectStore(this.constants.offline_database.object_store_names.CUSTOMER_ORDERS, sSuffix),
					this.clearObjectStore(this.constants.offline_database.object_store_names.ORDERPOS_CONFIRMATIONS, sSuffix),
					this.clearObjectStore(this.constants.offline_database.object_store_names.EQUI_TO_ORDER, sSuffix),
					this.clearObjectStore(this.constants.offline_database.object_store_names.EQUIPMENTS, sSuffix)
				];
				Promise.all(aPromises).then(function(aResults) {
					Logger.info("OfflineDatabaseHelper.clearAllObjectStores: clear objectstores success");
					fResolve();
				}.bind(this), function(reason) {
					Logger.error("OfflineDatabaseHelper.clearAllObjectStores: clear objectstores failed");
					fReject(reason);
				}.bind(this));
			}.bind(this));
		},

		/**
		 * Tries to remove all entries from given object-store.
		 * @param {String} sObjectStoreName
		 * @param {String} sSuffix indicates the database to be affected; optional, must be one of these: /utils/Const.offline_database.nameSuffices; when undefined, current suffix will be read from local storage
		 * @returns {Promise<any>} rejects, if the database is not opened or any other error occurs. In this case the db remains unchanged!
		 */
		clearObjectStore: function(sObjectStoreName, sSuffix) {
			return new Promise(function(fResolve, fReject) {
				if (this._oDataBases) {
					sSuffix = sSuffix || this._oOwnerComponent.getOfflineDBSuffix();
					Logger.info("OfflineDatabaseHelper.clearObjectStore: start clearing objectstore '" + sObjectStoreName + "' (" + sSuffix + ")");
					var oTransaction = this._oDataBases[sSuffix].transaction(sObjectStoreName, "readwrite");
					var oOrdersObjectStore = oTransaction.objectStore(sObjectStoreName);
					var oRequest = oOrdersObjectStore.clear();
					oRequest.onsuccess = function(oEvent) {
						Logger.info("OfflineDatabaseHelper.clearObjectStore: successfully cleared objectstore '" + sObjectStoreName + "' (" + sSuffix +
							")");
						fResolve();
					};
					oRequest.onerror = function(oEvent) {
						fReject("OfflineDatabaseHelper.clearObjectStore: failed to clear objectstore! Error: " + oEvent.target.error.message);
					};
				} else {
					fReject("OfflineDatabaseHelper.clearObjectStore: database not open!");
				}
			}.bind(this));
		},

		/**
		 * Tries to add/update the given entry to given object-store
		 * @param {String} sObjectStoreName
		 * @param {Object} oEntry
		 * @returns {Promise<any>} rejects, if the database is not opened or the entry could not be added/updated to db. In this case the db remains unchanged!
		 */
		addEntry: function(sObjectStoreName, oEntry, sSuffix) {
			return new Promise(function(fResolve, fReject) {
				if (this._oDataBases) {
					sSuffix = sSuffix || this._oOwnerComponent.getOfflineDBSuffix();
					Logger.info("OfflineDatabaseHelper.addEntry: start adding entry to objectstore '" + sObjectStoreName + "' (" + sSuffix + ")");
					var oTransaction = this._oDataBases[sSuffix].transaction(sObjectStoreName, "readwrite");
					var oOrdersObjectStore = oTransaction.objectStore(sObjectStoreName);
					var oRequest = oOrdersObjectStore.put(oEntry); // insert or update
					oRequest.onsuccess = function(oEvent) {
						Logger.info("OfflineDatabaseHelper.addEntry: successfully added entry to objectstore '" + sObjectStoreName + "' (" + sSuffix +
							")");
						fResolve();
					};
					oRequest.onerror = function(oEvent) {
						fReject("OfflineDatabaseHelper.addEntries: failed to add entry! Error: " + oEvent.target.error.message);
					};
				} else {
					fReject("OfflineDatabaseHelper.addEntry: database not open!");
				}
			}.bind(this));
		},

		/**
		 * Tries to add/update all given entries to given object-store.
		 * @param {String} sObjectStoreName
		 * @param {Array} aEntries
		 * @returns {Promise<any>} rejects, if the database is not opened or any entry could not be added to db (e.g. due to duplicate key). In this case the db remains unchanged!
		 */
		addEntries: function(sObjectStoreName, aEntries, sSuffix) {
			return new Promise(function(fResolve, fReject) {
				if (this._oDataBases) {
					if (aEntries && aEntries.length > 0) {
						sSuffix = sSuffix || this._oOwnerComponent.getOfflineDBSuffix();
						Logger.info("OfflineDatabaseHelper.addEntries: start adding entries to objectstore '" + sObjectStoreName + "' (" + sSuffix +
							")");
						var oTransaction = this._oDataBases[sSuffix].transaction(sObjectStoreName, "readwrite");
						oTransaction.oncomplete = function(oEvent) {
							Logger.info("OfflineDatabaseHelper.addEntries: successfully added entries to objectstore '" + sObjectStoreName + "' (" +
								sSuffix + ")");
							fResolve();
						};
						oTransaction.onerror = function(oEvent) {
							fReject("OfflineDatabaseHelper.addEntries: failed to add entries! Error: " + oEvent.target.error.message);
						};
						oTransaction.onabort = function(oEvent) {
							fReject("OfflineDatabaseHelper.addEntries: failed to add entries! Error: " + oEvent.target.error.message);
						};
						var oOrdersObjectStore = oTransaction.objectStore(sObjectStoreName);
						for (var i in aEntries) {
							oOrdersObjectStore.put(aEntries[i]);
						}
					} else {
						// no entries -> resolve anyway
						Logger.info("OfflineDatabaseHelper.addEntries: entries array empty");
						fResolve();
					}
				} else {
					fReject("OfflineDatabaseHelper.addEntries: database not open!");
				}
			}.bind(this));
		},

		/**
		 * Tries to delete an db entry in given object-store
		 * @param {String} sObjectStoreName
		 * @param {Object} oKeyValuemap json containing key:value pairs "pointing" to the entry to delete
		 * @returns {Promise<any>} rejects, if the database is not opened or any other error occurs. In this case the db remains unchanged!
		 */
		removeEntry: function(sObjectStoreName, oKeyValuemap, sSuffix) {
			return new Promise(function(fResolve, fReject) {
				if (this._oDataBases) {
					sSuffix = sSuffix || this._oOwnerComponent.getOfflineDBSuffix();
					Logger.info("OfflineDatabaseHelper.removeEntry: start removing entry from objectstore '" + sObjectStoreName + "' (" + sSuffix +
						")");
					var oTransaction = this._oDataBases[sSuffix].transaction(sObjectStoreName, "readwrite");
					var oObjectStore = oTransaction.objectStore(sObjectStoreName);
					var oIndex = oObjectStore.index(oObjectStore.indexNames[0]);
					// ensure that given values are passed in correct order; omit all keys not contained in index
					var aKeyValues = [];
					for (var i in oIndex.keyPath) {
						var sValue = oKeyValuemap[oIndex.keyPath[i]];
						if (sValue) {
							aKeyValues.push(sValue);
						}
					}
					var oRequest = oObjectStore.delete(aKeyValues);
					oRequest.onsuccess = function(oEvent) {
						Logger.info("OfflineDatabaseHelper.removeEntry: successfully removed entry from objectstore '" + sObjectStoreName + "' (" +
							sSuffix + ")");
						fResolve();
					};
					oRequest.onerror = function(oEvent) {
						fReject("OfflineDatabaseHelper.removeEntry: failed to remove entry! Error: " + oEvent.target.error.message);
					};
				} else {
					fReject("OfflineDatabaseHelper.removeEntry: database not open!");
				}
			}.bind(this));
		},

		/**
		 * Tries to read an db entry in given object-store
		 * @param {String} sObjectStoreName
		 * @param {Object} oKeyValuemap json containing key:value pairs "pointing" to the entry to read
		 * @returns {Promise<any>} rejects, if the database is not opened or any other error occurs. In this case the db remains unchanged!
		 */
		getEntry: function(sObjectStoreName, oKeyValuemap, sSuffix) {
			return new Promise(function(fResolve, fReject) {
				if (this._oDataBases) {
					sSuffix = sSuffix || this._oOwnerComponent.getOfflineDBSuffix();
					Logger.info("OfflineDatabaseHelper.getEntry: start reading entry from objectstore '" + sObjectStoreName + "' (" + sSuffix + ")");
					var oTransaction = this._oDataBases[sSuffix].transaction(sObjectStoreName, "readonly");
					var oObjectStore = oTransaction.objectStore(sObjectStoreName);
					var oIndex = oObjectStore.index(oObjectStore.indexNames[0]);
					// ensure that given values are passed in correct order; omit all keys not contained in index
					var aKeyValues = [];
					for (var i in oIndex.keyPath) {
						var sValue = oKeyValuemap[oIndex.keyPath[i]];
						if (sValue) {
							aKeyValues.push(sValue);
						}
					}
					var oRequest = oObjectStore.get(aKeyValues);
					// var oRequest = oObjectStore.get(oIndex.keyPath);
					oRequest.onsuccess = function(oEvent) {
						Logger.info("OfflineDatabaseHelper.getEntry: successfully read entry from objectstore '" + sObjectStoreName + "' (" + sSuffix +
							")");
						fResolve(oEvent.target.result);
					};
					oRequest.onerror = function(oEvent) {
						fReject("OfflineDatabaseHelper.getEntry: failed to read entry! Error: " + oEvent.target.error.message);
					};
				} else {
					fReject("OfflineDatabaseHelper.getEntry: database not open!");
				}
			}.bind(this));
		},

		/**
		 * Reads all entries from given object-store
		 * @param {String} sObjectStoreName
		 * @returns {Promise<any>} rejects, if the database is not opened or any other error occurs. In this case the db remains unchanged!
		 */
		getEntries: function(sObjectStoreName, sSuffix) {
			return new Promise(function(fResolve, fReject) {
				if (this._oDataBases) {
					sSuffix = sSuffix || this._oOwnerComponent.getOfflineDBSuffix();
					Logger.info("OfflineDatabaseHelper.getEntries: start reading entries from objectstore '" + sObjectStoreName + "' (" + sSuffix +
						")");
					var oTransaction = this._oDataBases[sSuffix].transaction(sObjectStoreName, "readonly");
					var oOrdersObjectStore = oTransaction.objectStore(sObjectStoreName);
					var oRequest = oOrdersObjectStore.getAll();
					oRequest.onerror = function(oEvent) {
						fReject("OfflineDatabaseHelper.getEntries: failed to read entries! Error: " + oEvent.target.error.message);
					};
					oRequest.onsuccess = function(oEvent) {
						Logger.info("OfflineDatabaseHelper.getEntries: successfully read entries from objectstore '" + sObjectStoreName + "' (" +
							sSuffix + ")");
						fResolve(oEvent.target.result);
					};
				} else {
					fReject("OfflineDatabaseHelper.getEntries: database not open!");
				}
			}.bind(this));
		},

		/* ========================================================================================================== */
		// Private Functions
		/* ========================================================================================================== */

		_handleRequestError: function(oEvent) {
			Logger.error("OfflineDatabaseHelper: " + this.errorMsg + " Error: " + oEvent.target.error.message);
			if (this.fCallback) {
				this.fCallback();
			}
		},

		_handleDBClose: function(oEvent) {
			Logger.error("OfflineDatabaseHelper: data-base unexpectedly closed!");
			MessageToast.show(this.translate("db.msg.closed.unexpectedly"), {
				autoClose: false
			});
		},

		_handleTransactionAborted: function(oEvent) {
			Logger.error("OfflineDatabaseHelper: Transaction aborted! Error: " + oEvent.target.error.name);
			if (oEvent.target.error.name === "QuotaExceededError") {
				MessageToast.show(this.translate("db.msg.transaction.abort.quota"), {
					autoClose: false
				});
			} else {
				MessageToast.show(this.translate("db.msg.transaction.abort"), {
					autoClose: false
				});
			}
		},

		_initIndexDBConstants: function() {
			// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Using_an_experimental_version_of_IndexedDB
			// ggf. handelt es sich um read-only Eigenschaften des window Objekts
			try {
				if (!window.indexedDB) {
					// In the following line, you should include the prefixes of implementations you want to test.
					window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
				}
				if (!window.IDBTransaction) {
					// Moreover, you may need references to some window.IDB* objects:
					window.IDBTransaction = window.webkitIDBTransaction || window.msIDBTransaction || {
						READ_WRITE: "readwrite"
					}; // This line should only be needed if it is needed to support the object's constants for older browsers
				}
				if (!window.IDBKeyRange) {
					window.IDBKeyRange = window.webkitIDBKeyRange || window.msIDBKeyRange;
				}
				// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
				return true;
			} catch (ex) {
				// TODO handle unavailability of indexDB
				logger.error("OfflineDatabaseHelper._initIndexDBConstants: unable to initialize indexDB references: " + JSON.stringify(ex));
				return false;
			}
		},

		_initDBErrorEventHandler: function(oDataBase, fErrorCallback) {
			if (!oDataBase.onerror) {
				oDataBase.onerror = this._handleRequestError.bind({
					errorMsg: "Executing request failed!",
					fCallback: fErrorCallback
				});
			}
			if (!oDataBase.onclose) {
				oDataBase.onclose = this._handleDBClose.bind(this._oOwnerComponent);
			}
			if (!oDataBase.onabort) {
				oDataBase.onabort = this._handleTransactionAborted.bind(this._oOwnerComponent);
			}
		}

	});

	return OfflineDatabaseHelper;
});