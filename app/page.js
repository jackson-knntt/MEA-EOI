"use client";

import { useState } from "react";
import Image from "next/image";
import "./globals.css";

const STEPS = ["Your Details", "Your Interests", "Your Organisation"];

const initial = {
  // Step 1
  title: "",
  firstName: "",
  lastName: "",
  email: "",
  jobTitle: "",
  company: "",
  linkedin: "",
  telephone: "",
  // Step 2
  whyJoin: "",
  sectors: "",
  countriesOfInterest: "",
  orgTypes: [],
  orgTypeOther: "",
  interests: [],
  interestsOther: "",
  speakingInterest: "",
  ypgInterest: "",
  // Step 3
  menaExperience: "",
  menaCountries: "",
  relevantCountries: "",
  referrer: "",
  companyDesc: "",
  roleDesc: "",
  sponsorshipInterest: "",
  companySize: "",
  otherComments: "",
  consentComms: false,
  consentPhoto: false,
  submittedAt: new Date().toISOString().slice(0, 10),
};

export default function Page() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState("idle");
  const [submitted, setSubmitted] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleCheck(field, value) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      alert(err.message);
    }
  }

  const progressPct = (step / 3) * 100;

  if (submitted) return <SuccessScreen />;

  return (
    <>
      {/* ── Header ── */}
      <div className="header">
        <div className="header-inner">
          <div className="logo-wrap">
            <Image src="/mea-logo.png" alt="The Middle East Association" width={64} height={64} />
          </div>
          <div className="header-text">
            <h1>The Middle East Association</h1>
            <p>Expression of Interest</p>
          </div>
        </div>
      </div>
      <div className="header-bar" />

      {/* ── Progress ── */}
      <div className="progress-wrap">
        <div className="progress-labels">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={
                "progress-label" +
                (i + 1 === step ? " active" : "") +
                (i + 1 < step ? " done" : "")
              }
            >
              {label}
            </span>
          ))}
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="step-counter">Step {step} of 3</div>
      </div>

      <div className="form-wrap">
        <form className="form-card" onSubmit={handleSubmit} noValidate>

          {/* ══════════════════════════
              STEP 1 — Your Details
          ══════════════════════════ */}
          {step === 1 && (
            <>
              <div className="section-header">
                <div className="section-icon">👤</div>
                <div>
                  <h2>Your Details</h2>
                  <p>Personal and professional information</p>
                </div>
              </div>
              <div className="form-body">
                <p className="intro-text">
                  Thank you for your interest in The Middle East Association. Please complete
                  this short form and we will be in touch shortly to discuss your membership.
                </p>

                <div className="field-row">
                  <div className="field">
                    <label>Title <span className="opt">(optional)</span></label>
                    <select value={form.title} onChange={(e) => update("title", e.target.value)}>
                      <option value="">Select…</option>
                      {["Mr","Mrs","Ms","Miss","Dr","Prof","Sir","Lord","Lady","H.E.","Other"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field" />
                </div>

                <div className="field-row">
                  <Field label="First Name" id="firstName" value={form.firstName}
                    onChange={(v) => update("firstName", v)} placeholder="Jane" />
                  <Field label="Last Name" id="lastName" value={form.lastName}
                    onChange={(v) => update("lastName", v)} placeholder="Smith" />
                </div>

                <div className="field-row single">
                  <Field label="Email Address" id="email" type="email" value={form.email}
                    onChange={(v) => update("email", v)} placeholder="jane.smith@company.com" />
                </div>

                <div className="field-row">
                  <Field label="Job Title" id="jobTitle" value={form.jobTitle}
                    onChange={(v) => update("jobTitle", v)} placeholder="Director, Senior Manager…" />
                  <Field label="Company Name" id="company" value={form.company}
                    onChange={(v) => update("company", v)} placeholder="Your organisation" />
                </div>

                <div className="field-row single">
                  <Field label="LinkedIn URL" id="linkedin" type="url" optional value={form.linkedin}
                    onChange={(v) => update("linkedin", v)} placeholder="https://linkedin.com/in/…" />
                </div>

                <div className="field-row single">
                  <Field label="Telephone" id="telephone" type="tel" optional value={form.telephone}
                    onChange={(v) => update("telephone", v)} placeholder="+44 20 7000 0000" />
                </div>

                <div className="btn-row">
                  <div />
                  <button type="button" className="submit-btn" style={{ width: "auto", padding: "12px 32px" }} onClick={goNext}>
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════
              STEP 2 — Your Interests
          ══════════════════════════ */}
          {step === 2 && (
            <>
              <div className="section-header">
                <div className="section-icon">🌍</div>
                <div>
                  <h2>Your Interests</h2>
                  <p>Help us understand your focus areas</p>
                </div>
              </div>
              <div className="form-body">

                <div className="field-row single">
                  <div className="field">
                    <label>Why do you want to join the Middle East Association? <span className="opt">(optional)</span></label>
                    <textarea value={form.whyJoin} onChange={(e) => update("whyJoin", e.target.value)}
                      placeholder="Tell us what draws you to the MEA and what you hope to gain from membership…" />
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Are there specific industries or sectors you are particularly interested in? <span className="opt">(optional)</span></label>
                    <textarea value={form.sectors} onChange={(e) => update("sectors", e.target.value)}
                      placeholder="e.g. Energy, Finance, Technology, Defence…" />
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Are there specific countries you are particularly interested in? <span className="opt">(optional)</span></label>
                    <textarea value={form.countriesOfInterest} onChange={(e) => update("countriesOfInterest", e.target.value)}
                      placeholder="e.g. Saudi Arabia, UAE, Egypt, Iraq…" />
                  </div>
                </div>

                {/* Organisation type */}
                <div className="field-row single">
                  <div className="field">
                    <label>Organisation type <span className="opt">(optional)</span></label>
                    <div className="check-group cols-2">
                      {[
                        "Corporate / Private Company",
                        "Think Tank / Research Institute",
                        "Academic Institution",
                        "Government / Public Sector",
                        "Philanthropy and Development",
                        "NGO / Non-Profit",
                        "Other (please specify)",
                      ].map((opt) => (
                        <label key={opt} className="check-item">
                          <input type="checkbox" checked={form.orgTypes.includes(opt)}
                            onChange={() => toggleCheck("orgTypes", opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {form.orgTypes.includes("Other (please specify)") && (
                      <input type="text" style={{ marginTop: 10 }} value={form.orgTypeOther}
                        onChange={(e) => update("orgTypeOther", e.target.value)}
                        placeholder="Please specify…" />
                    )}
                  </div>
                </div>

                {/* Primary areas of interest */}
                <div className="field-row single" style={{ marginTop: 20 }}>
                  <div className="field">
                    <label>Primary areas of interest <span className="opt">(optional)</span></label>
                    <div className="check-group cols-2">
                      {[
                        "Business & Investment",
                        "Climate & Energy",
                        "Philanthropy and Development",
                        "Politics & Policy",
                        "Security & Defence",
                        "Technology & Innovation",
                        "Academia & Research",
                        "Diplomacy & Government Relations",
                        "Other (please specify)",
                      ].map((opt) => (
                        <label key={opt} className="check-item">
                          <input type="checkbox" checked={form.interests.includes(opt)}
                            onChange={() => toggleCheck("interests", opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {form.interests.includes("Other (please specify)") && (
                      <input type="text" style={{ marginTop: 10 }} value={form.interestsOther}
                        onChange={(e) => update("interestsOther", e.target.value)}
                        placeholder="Please specify…" />
                    )}
                  </div>
                </div>

                {/* Speaking + YPG */}
                <div className="field-row" style={{ marginTop: 20 }}>
                  <div className="field">
                    <label>Would you be interested in joining panels or speaking roles? <span className="opt">(optional)</span></label>
                    <select value={form.speakingInterest} onChange={(e) => update("speakingInterest", e.target.value)}>
                      <option value="">Select…</option>
                      <option>Yes, I am interested</option>
                      <option>Possibly, depending on the topic</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Are you under 35 and interested in joining the Young Professionals Group? <span className="opt">(optional)</span></label>
                    <select value={form.ypgInterest} onChange={(e) => update("ypgInterest", e.target.value)}>
                      <option value="">Select…</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>

                <div className="btn-row">
                  <button type="button" className="back-btn" onClick={goBack}>← Back</button>
                  <button type="button" className="submit-btn" style={{ width: "auto", padding: "12px 32px" }} onClick={goNext}>
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════
              STEP 3 — Your Organisation
          ══════════════════════════ */}
          {step === 3 && (
            <>
              <div className="section-header">
                <div className="section-icon">🏢</div>
                <div>
                  <h2>Your Organisation</h2>
                  <p>Background and experience in the region</p>
                </div>
              </div>
              <div className="form-body">

                <div className="field-row single">
                  <div className="field">
                    <label>What previous experience and existing partnerships do you have in the Middle East? <span className="opt">(optional)</span></label>
                    <textarea value={form.menaExperience} onChange={(e) => update("menaExperience", e.target.value)}
                      placeholder="Please describe your existing work or partnerships in the MENA region…" />
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Which countries have you worked with in the MENA region? <span className="opt">(optional)</span></label>
                    <textarea value={form.menaCountries} onChange={(e) => update("menaCountries", e.target.value)}
                      placeholder="e.g. Saudi Arabia, UAE, Jordan…" />
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Which regions or countries are most relevant to your work? <span className="opt">(optional)</span></label>
                    <textarea value={form.relevantCountries} onChange={(e) => update("relevantCountries", e.target.value)}
                      placeholder="e.g. Gulf states, Levant, North Africa…" />
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Who introduced you to the Middle East Association? <span className="opt">(optional)</span></label>
                    <input type="text" value={form.referrer} onChange={(e) => update("referrer", e.target.value)}
                      placeholder="Name of person or organisation…" />
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Please provide a brief description of your company <span className="opt">(optional)</span></label>
                    <textarea value={form.companyDesc} onChange={(e) => update("companyDesc", e.target.value)}
                      placeholder="What does your organisation do?…" />
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Please provide a brief description of your role <span className="opt">(optional)</span></label>
                    <textarea value={form.roleDesc} onChange={(e) => update("roleDesc", e.target.value)}
                      placeholder="What are your key responsibilities?…" />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Would your company be interested in sponsoring MEA events? <span className="opt">(optional)</span></label>
                    <select value={form.sponsorshipInterest} onChange={(e) => update("sponsorshipInterest", e.target.value)}>
                      <option value="">Select…</option>
                      <option>Yes, we would like to discuss sponsorship</option>
                      <option>Possibly</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Approximate size of company <span className="opt">(optional)</span></label>
                    <select value={form.companySize} onChange={(e) => update("companySize", e.target.value)}>
                      <option value="">Select…</option>
                      <option>1–5 Employees</option>
                      <option>6–30 Employees</option>
                      <option>31–250 Employees</option>
                      <option>250+ Employees</option>
                    </select>
                  </div>
                </div>

                <div className="field-row single">
                  <div className="field">
                    <label>Is there any other information or comments you would like to share? <span className="opt">(optional)</span></label>
                    <textarea value={form.otherComments} onChange={(e) => update("otherComments", e.target.value)}
                      placeholder="Anything else you would like us to know…" />
                  </div>
                </div>

                {/* Consent */}
                <div className="terms-box">
                  <p>
                    The Middle East Association is committed to protecting and respecting your privacy.
                    We will only use your personal information to administer your account and to
                    provide the products and services you have requested from us.
                  </p>
                  <div className="check-row" style={{ marginBottom: 14 }}>
                    <input id="consentComms" type="checkbox" checked={form.consentComms}
                      onChange={(e) => update("consentComms", e.target.checked)} />
                    <label htmlFor="consentComms">
                      I agree to receive communications from The Middle East Association
                    </label>
                  </div>
                  <div className="check-row">
                    <input id="consentPhoto" type="checkbox" checked={form.consentPhoto}
                      onChange={(e) => update("consentPhoto", e.target.checked)} />
                    <label htmlFor="consentPhoto">
                      I acknowledge that photography takes place during MEA events and consent
                      to my image appearing in general event media and social media posts
                    </label>
                  </div>
                </div>

                <div className="btn-row">
                  <button type="button" className="back-btn" onClick={goBack}>← Back</button>
                  <button type="submit" className="submit-btn"
                    style={{ width: "auto", padding: "12px 32px" }}
                    disabled={status === "submitting"}>
                    {status === "submitting" ? "Submitting…" : "Submit Application"}
                  </button>
                </div>

                <p className="foot-note">
                  By submitting this form you consent to allow The Middle East Association
                  to store and process the personal information submitted above.
                </p>
              </div>
            </>
          )}

        </form>
      </div>
    </>
  );
}

function SuccessScreen() {
  return (
    <>
      <div className="header">
        <div className="header-inner">
          <div className="logo-wrap">
            <Image src="/mea-logo.png" alt="The Middle East Association" width={64} height={64} />
          </div>
          <div className="header-text">
            <h1>The Middle East Association</h1>
            <p>Expression of Interest</p>
          </div>
        </div>
      </div>
      <div className="header-bar" />
      <div className="form-wrap">
        <div className="form-card">
          <div className="section-header" style={{ background: "#1e6b3c" }}>
            <div className="section-icon">✅</div>
            <div>
              <h2>Expression of Interest submitted</h2>
              <p>Thank you — we will be in touch soon</p>
            </div>
          </div>
          <div className="form-body">
            <p className="intro-text">
              Thank you for your interest in The Middle East Association. We have received
              your expression of interest and will review it shortly. A member of our team
              will be in touch with you within the next few days.
            </p>
            <div className="who-box">
              <div className="who-label">What happens next</div>
              <p>
                Our team will review your application and contact you by email to confirm
                whether your expression of interest has been accepted. If accepted, you will
                receive a link to complete your membership and proceed to payment.
                In the meantime, please follow us on LinkedIn to stay up to date with MEA
                news and upcoming events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ id, label, optional, type = "text", value, onChange, placeholder }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="opt">(optional)</span>}
      </label>
      <input id={id} type={type} value={value} placeholder={placeholder || ""}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
