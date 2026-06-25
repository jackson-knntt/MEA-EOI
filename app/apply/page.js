"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "../globals.css";

const CLOUDINARY_CLOUD = "dwdrwtnvf";
const CLOUDINARY_PRESET = "mea-membership-headshots";

export default function ApplyPage() {
  const [email, setEmail] = useState("");
  const [eoiData, setEoiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [website, setWebsite] = useState("");
  const [vat, setVat] = useState("");
  const [bio, setBio] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const [headshot, setHeadshot] = useState(null);
  const [headshotPreview, setHeadshotPreview] = useState(null);
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [banner, setBanner] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Read email from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (!emailParam) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEmail(emailParam);
    fetchEoiData(emailParam);
  }, []);

  async function fetchEoiData(emailAddr) {
    try {
      const res = await fetch(`/apply/api/lookup?email=${encodeURIComponent(emailAddr)}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setEoiData(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  // Headshot handlers
  function handleFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBanner({ type: "error", text: "Please select an image file." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBanner({ type: "error", text: "Image must be under 8 MB." });
      return;
    }
    setBanner(null);
    setHeadshot(file);
    setHeadshotUrl("");
    const reader = new FileReader();
    reader.onload = (e) => setHeadshotPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function removeHeadshot() {
    setHeadshot(null);
    setHeadshotPreview(null);
    setHeadshotUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadToCloudinary() {
    if (!headshot) return "";
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", headshot);
      data.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: "POST", body: data }
      );
      if (!res.ok) throw new Error("Upload failed.");
      const json = await res.json();
      setHeadshotUrl(json.secure_url);
      return json.secure_url;
    } catch {
      throw new Error("We could not upload your headshot. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setBanner(null);

    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    setStatus("submitting");

    try {
      let finalHeadshotUrl = headshotUrl;
      if (headshot && !headshotUrl) {
        finalHeadshotUrl = await uploadToCloudinary();
      }

      const payload = {
        email,
        eoiData,
        website,
        vat,
        bio,
        headshotUrl: finalHeadshotUrl,
        termsAccepted: true,
        applicationDate: new Date().toISOString().slice(0, 10),
      };

      const res = await fetch("/apply/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setBanner({
        type: "success",
        text: "Your details have been received. Taking you to secure payment…",
      });

      setTimeout(() => {
        window.location.href = "https://buy.stripe.com/aEU3fgfZqcq8frW3cq";
      }, 1500);

    } catch (err) {
      setStatus("error");
      setBanner({ type: "error", text: err.message });
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="form-wrap">
          <div className="form-card">
            <div className="form-body">
              <p className="intro-text">Loading your details…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Header />
        <div className="form-wrap">
          <div className="form-card">
            <div className="section-header" style={{ background: "var(--error)" }}>
              <div className="section-icon">⚠️</div>
              <div>
                <h2>Link not recognised</h2>
                <p>Please use the link sent to you by the MEA team</p>
              </div>
            </div>
            <div className="form-body">
              <p className="intro-text">
                We could not find an expression of interest matching this link.
                Please use the exact link sent to you in your acceptance email,
                or contact us at{" "}
                <a href="mailto:membership@the-mea.com" className="success-link">
                  membership@the-mea.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Header />
        <div className="form-wrap">
          <div className="form-card">
            <div className="section-header" style={{ background: "#1e6b3c" }}>
              <div className="section-icon">✅</div>
              <div>
                <h2>Payment received — welcome to the MEA</h2>
                <p>Your Corporate Membership is now active</p>
              </div>
            </div>
            <div className="form-body">
              <p className="intro-text">
                Thank you for completing your Corporate Membership. We look forward
                to welcoming you to The Middle East Association.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const submitting = status === "submitting";

  return (
    <>
      <Header />
      <div className="form-wrap">
        <form className="form-card" onSubmit={handleSubmit} noValidate>

          {/* ── Welcome ── */}
          <div className="section-header">
            <div className="section-icon">🎉</div>
            <div>
              <h2>Complete your membership</h2>
              <p>A few final details before payment</p>
            </div>
          </div>
          <div className="form-body">
            {banner && <div className={`banner ${banner.type}`}>{banner.text}</div>}

            <p className="intro-text">
              Congratulations — your expression of interest has been accepted.
              We just need a few more details to complete your Corporate Membership
              before taking you to secure payment.
            </p>

            {/* Show pre-filled details from EOI */}
            {eoiData && (
              <div className="who-box" style={{ marginBottom: 28 }}>
                <div className="who-label">Your details from your expression of interest</div>
                <p>
                  We already have your details on file from your expression of interest.
                  These will be carried across to your membership profile automatically.
                </p>
                <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.8, color: "var(--text)" }}>
                  {eoiData.fullName && <div><strong>Name:</strong> {eoiData.fullName}</div>}
                  {eoiData.email && <div><strong>Email:</strong> {eoiData.email}</div>}
                  {eoiData.jobTitle && <div><strong>Job Title:</strong> {eoiData.jobTitle}</div>}
                  {eoiData.company && <div><strong>Company:</strong> {eoiData.company}</div>}
                </div>
              </div>
            )}
          </div>

          {/* ── Additional Details ── */}
          <div className="section-header">
            <div className="section-icon">🏢</div>
            <div>
              <h2>Additional Details</h2>
              <p>A few things we still need from you</p>
            </div>
          </div>
          <div className="form-body">

            <div className="field-row">
              <div className="field">
                <label>Website <span className="opt">(optional)</span></label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://" />
              </div>
              <div className="field">
                <label>VAT Registration Number <span className="opt">(optional)</span></label>
                <input type="text" value={vat} onChange={(e) => setVat(e.target.value)} />
              </div>
            </div>

            <div className="field-row single">
              <div className="field">
                <label>Professional Bio <span className="opt">(optional)</span></label>
                <textarea style={{ minHeight: 130 }} value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A brief professional biography for the MEA member directory…" />
              </div>
            </div>

            <div className="field-row single">
              <div className="field">
                <label>Headshot <span className="opt">(optional — JPG or PNG, max 8 MB)</span></label>
                {!headshotPreview ? (
                  <div
                    className={`upload-area${dragOver ? " drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFileSelect(e.dataTransfer.files[0]);
                    }}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files[0])} />
                    <div className="upload-icon">📷</div>
                    <div className="upload-label">Click to upload or drag and drop</div>
                    <div className="upload-hint">JPG, PNG, WEBP — max 8 MB</div>
                  </div>
                ) : (
                  <div className="upload-preview">
                    <img src={headshotPreview} alt="Headshot preview" />
                    <span className="upload-preview-name">{headshot?.name}</span>
                    <button type="button" className="upload-remove" onClick={removeHeadshot}>
                      Remove
                    </button>
                  </div>
                )}
                {uploading && <div className="upload-progress">Uploading headshot…</div>}
                {headshotUrl && (
                  <div className="upload-progress" style={{ color: "var(--success)" }}>
                    ✓ Headshot uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Terms & Payment ── */}
          <div className="section-header">
            <div className="section-icon">💳</div>
            <div>
              <h2>Terms &amp; Payment</h2>
              <p>£2,500 + VAT — secure payment via Stripe</p>
            </div>
          </div>
          <div className="form-body">

            <div className="terms-box">
              <p>
                I / We apply for Corporate Membership of The Middle East Association and agree,
                if accepted, to be bound by the Memorandum and Articles of Association.
                I / We further give explicit consent for The Middle East Association to
                communicate with me / us for membership and marketing purposes. Membership
                continues until terminated by one month&rsquo;s notice in writing, or
                non-payment of the annual subscription.
              </p>
              <div className="check-row">
                <input id="terms" type="checkbox" checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }} />
                <label htmlFor="terms">
                  I have read and accept the terms and conditions of Corporate Membership
                </label>
              </div>
              {termsError && (
                <p className="field-error show" style={{ marginTop: 10 }}>
                  Please accept the terms and conditions to continue.
                </p>
              )}
            </div>

            <button className="submit-btn" type="submit" disabled={submitting || uploading}>
              {submitting ? "Saving your details…" : "Continue to payment →"}
            </button>
            <p className="foot-note">
              Your details are saved securely before you are taken to payment via Stripe.
            </p>
          </div>

        </form>
      </div>
    </>
  );
}

function Header() {
  return (
    <>
      <div className="header">
        <div className="header-inner">
          <div className="logo-wrap">
            <Image src="/mea-logo.png" alt="The Middle East Association" width={64} height={64} />
          </div>
          <div className="header-text">
            <h1>The Middle East Association</h1>
            <p>Corporate Membership — £2,500 + VAT per year</p>
          </div>
        </div>
      </div>
      <div className="header-bar" />
    </>
  );
}
