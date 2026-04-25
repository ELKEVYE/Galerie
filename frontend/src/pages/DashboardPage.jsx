import { useEffect, useState } from "react";

import { deletePhoto, fetchPhotos, updatePhoto, uploadPhotos } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import "../styles/dashboard.css";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

function createUploadEntry(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    description: "",
    date: new Date().toISOString().slice(0, 10),
  };
}

function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getPhotoUrl(photo) {
  const rawUrl = photo.image_url || photo.image || "";

  if (!rawUrl) {
    return "";
  }

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/media/")) {
    return `${API_URL}${rawUrl}`;
  }

  if (rawUrl.startsWith("media/")) {
    return `${API_URL}/${rawUrl}`;
  }

  return `${API_URL}/media/${rawUrl}`;
}

function buildPhotoFilename(photo) {
  const extension = getPhotoUrl(photo).split(".").pop()?.split("?")[0];
  const safeDate = photo.date || "photo";
  return `photo-${photo.id}-${safeDate}.${extension || "jpg"}`;
}

function DashboardPage() {
  const { user, logout } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [uploadEntries, setUploadEntries] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [editForm, setEditForm] = useState({
    description: "",
    date: "",
    image: null,
    previewUrl: "",
  });
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  async function loadPhotos() {
    setLoadingPhotos(true);
    setPhotoError("");

    try {
      const data = await fetchPhotos();
      setPhotos(data);
    } catch (error) {
      setPhotoError("Impossible de charger vos photos.");
    } finally {
      setLoadingPhotos(false);
    }
  }

  function handleFilesSelection(event) {
    const files = Array.from(event.target.files || []);
    setPhotoError("");
    setPhotoSuccess("");
    setUploadEntries(files.map(createUploadEntry));
  }

  function updateUploadEntry(entryId, field, value) {
    setUploadEntries((current) =>
      current.map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();

    if (uploadEntries.length === 0) {
      setPhotoError("Selectionnez au moins une photo a envoyer.");
      return;
    }

    if (uploadEntries.some((entry) => !entry.date)) {
      setPhotoError("Chaque photo doit avoir une date.");
      return;
    }

    setIsUploading(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const createdPhotos = await uploadPhotos(uploadEntries);
      setPhotos((current) => [...createdPhotos, ...current]);
      setUploadEntries([]);
      setPhotoSuccess("Les photos ont ete envoyees avec succes.");
    } catch (error) {
      setPhotoError("Impossible d'envoyer les photos.");
    } finally {
      setIsUploading(false);
    }
  }

  function startEditingPhoto(photo) {
    setEditingPhotoId(photo.id);
    setEditForm({
      description: photo.description || "",
      date: photo.date || "",
      image: null,
      previewUrl: getPhotoUrl(photo),
    });
    setPhotoError("");
    setPhotoSuccess("");
  }

  function cancelEditingPhoto() {
    setEditingPhotoId(null);
    setEditForm({ description: "", date: "", image: null, previewUrl: "" });
  }

  function handleEditImageSelection(event) {
    const file = event.target.files?.[0] || null;
    setEditForm((current) => ({
      ...current,
      image: file,
      previewUrl: file ? createPreviewUrl(file) : current.previewUrl,
    }));
  }

  async function handlePhotoUpdate(photoId) {
    if (!editForm.date) {
      setPhotoError("La date est obligatoire.");
      return;
    }

    setIsSavingPhoto(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const updatedPhoto = await updatePhoto(photoId, {
        description: editForm.description,
        date: editForm.date,
        image: editForm.image,
      });
      setPhotos((current) =>
        current.map((photo) =>
          photo.id === photoId ? { ...photo, ...updatedPhoto } : photo,
        ),
      );
      cancelEditingPhoto();
      setPhotoSuccess("La photo a ete mise a jour.");
    } catch (error) {
      setPhotoError("Impossible de modifier cette photo.");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handlePhotoDelete(photoId) {
    setDeletingPhotoId(photoId);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      await deletePhoto(photoId);
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
      if (editingPhotoId === photoId) {
        cancelEditingPhoto();
      }
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }
      setPhotoSuccess("La photo a ete supprimee.");
    } catch (error) {
      setPhotoError("Impossible de supprimer cette photo.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function handlePhotoDownload(photo) {
    const imageUrl = getPhotoUrl(photo);

    if (!imageUrl) {
      setPhotoError("Impossible de telecharger cette photo.");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = buildPhotoFilename(photo);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setPhotoError("Le telechargement de la photo a echoue.");
    }
  }

  function openPhotoPreview(photo) {
    setSelectedPhoto(photo);
  }

  function closePhotoPreview() {
    setSelectedPhoto(null);
  }

  const normalizedDescriptionFilter = normalizeText(descriptionFilter);
  const filteredPhotos = photos.filter((photo) => {
    const matchesDescription = normalizedDescriptionFilter
      ? normalizeText(photo.description).includes(normalizedDescriptionFilter)
      : true;

    const matchesDate = dateFilter ? (photo.date || "").startsWith(dateFilter) : true;

    return matchesDescription && matchesDate;
  });

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        closePhotoPreview();
      }
    }

    if (selectedPhoto) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedPhoto]);

  return (
    <div className="dashboard-stack">
      <section className="panel dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dashboard galerie</p>
            <h2>Gerer votre galerie</h2>
          </div>

          <div className="section-heading-actions">
            {/* <p className="panel-copy section-caption">
              Importez, filtrez et visualisez vos photos dans une interface moderne,
              propre et responsive.
            </p> */}
            <button type="button" className="danger-button" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <form className="photo-upload-form" onSubmit={handleUploadSubmit}>
          <div className="upload-dropzone">
            <div className="upload-dropzone-copy">
              <p className="upload-kicker">Upload</p>
              <h3>Ajoutez de nouvelles images</h3>
              <p className="panel-copy">
                Selection multiple acceptee. Chaque photo peut recevoir une
                description et une date avant l'envoi.
              </p>
            </div>

            <label className="field file-field" htmlFor="photos">
              <span>Photos a importer</span>
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelection}
              />
            </label>
          </div>

          {uploadEntries.length > 0 ? (
            <div className="upload-entry-list">
              {uploadEntries.map((entry, index) => (
                <article key={entry.id} className="upload-entry-card">
                  <div>
                    <strong>{entry.file.name}</strong>
                    <p className="panel-copy">
                      Photo {index + 1} a envoyer pour {user?.username}
                    </p>
                  </div>

                  <label className="field">
                    <span>Description</span>
                    <textarea
                      value={entry.description}
                      onChange={(event) =>
                        updateUploadEntry(entry.id, "description", event.target.value)
                      }
                      rows={3}
                      placeholder="Description de la photo"
                    />
                  </label>

                  <label className="field">
                    <span>Date</span>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(event) =>
                        updateUploadEntry(entry.id, "date", event.target.value)
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          ) : null}

          <div className="inline-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isUploading || uploadEntries.length === 0}
            >
              {isUploading ? "Envoi..." : "Uploader les photos"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setUploadEntries([])}
              disabled={isUploading || uploadEntries.length === 0}
            >
              Vider la selection
            </button>
          </div>
        </form>

        {photoError ? <p className="banner-error">{photoError}</p> : null}
        {photoSuccess ? <p className="banner-success">{photoSuccess}</p> : null}

        <div className="photo-filters">
          <label className="field filter-field">
            <span>Recherche par description</span>
            <input
              type="text"
              value={descriptionFilter}
              onChange={(event) => setDescriptionFilter(event.target.value)}
              placeholder="Rechercher une description"
            />
          </label>

          <label className="field filter-field">
            <span>Filtrer par date</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>

          <div className="inline-actions filter-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setDescriptionFilter("");
                setDateFilter("");
              }}
              disabled={!descriptionFilter && !dateFilter}
            >
              Reinitialiser les filtres
            </button>
          </div>
        </div>

        <div className="photo-list-header">
          <div>
            <p className="eyebrow">Bibliotheque</p>
            <h3>Vos photos</h3>
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={loadPhotos}
            disabled={loadingPhotos}
          >
            {loadingPhotos ? "Chargement..." : "Rafraichir"}
          </button>
        </div>

        {loadingPhotos ? <p className="panel-copy">Chargement des photos...</p> : null}

        {!loadingPhotos && photos.length === 0 ? (
          <div className="empty-state">
            <p>Aucune photo pour le moment.</p>
          </div>
        ) : null}

        {!loadingPhotos && photos.length > 0 && filteredPhotos.length === 0 ? (
          <div className="empty-state">
            <p>Aucune photo ne correspond aux filtres actuels.</p>
          </div>
        ) : null}

        {filteredPhotos.length > 0 ? (
          <div className="photo-grid">
            {filteredPhotos.map((photo) => {
              const isEditing = editingPhotoId === photo.id;
              const isDeleting = deletingPhotoId === photo.id;

              return (
                <article key={photo.id} className="photo-card">
                  <div className="photo-card-media">
                    <button
                      type="button"
                      className="photo-preview-trigger"
                      onClick={() => {
                        if (!isEditing) {
                          openPhotoPreview(photo);
                        }
                      }}
                      disabled={isEditing}
                    >
                      <img
                        src={getPhotoUrl(photo)}
                        alt={photo.description || `Photo du ${photo.date}`}
                        className="photo-card-image"
                      />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="photo-card-body">
                      <div className="photo-preview-panel">
                        <img
                          src={editForm.previewUrl || getPhotoUrl(photo)}
                          alt="Apercu de la photo a enregistrer"
                          className="photo-card-image"
                        />
                      </div>

                      <label className="field">
                        <span>Nouvelle image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageSelection}
                        />
                      </label>

                      <label className="field">
                        <span>Description</span>
                        <textarea
                          rows={3}
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="field">
                        <span>Date</span>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              date: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <div className="inline-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handlePhotoUpdate(photo.id)}
                          disabled={isSavingPhoto}
                        >
                          {isSavingPhoto ? "Sauvegarde..." : "Enregistrer"}
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={cancelEditingPhoto}
                          disabled={isSavingPhoto}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="photo-card-body">
                      <div className="photo-meta">
                        <p className="photo-description">
                          {photo.description || "Aucune description"}
                        </p>
                        <p className="photo-date">{photo.date}</p>
                      </div>

                      <div className="inline-actions photo-card-actions">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => startEditingPhoto(photo)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handlePhotoDownload(photo)}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handlePhotoDelete(photo.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      {selectedPhoto ? (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Apercu agrandi de la photo"
          onClick={closePhotoPreview}
        >
          <div
            className="photo-lightbox-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-button"
              onClick={closePhotoPreview}
            >
              Fermer
            </button>

            <div className="photo-lightbox-media">
              <img
                src={getPhotoUrl(selectedPhoto)}
                alt={selectedPhoto.description || `Photo du ${selectedPhoto.date}`}
                className="photo-lightbox-image"
              />
            </div>

            <div className="photo-lightbox-body">
              <p className="eyebrow">Apercu</p>
              <h3>{selectedPhoto.description || "Aucune description"}</h3>
              <p className="photo-date">
                {selectedPhoto.date || "Date indisponible"}
              </p>

              <div className="inline-actions photo-lightbox-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handlePhotoDownload(selectedPhoto)}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={closePhotoPreview}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardPage;
