import { useEffect, useRef } from "react";
import type { SRCMember } from "../data/srcMembers";

type SRCMemberProfileDialogProps = {
  member: SRCMember;
  onClose: () => void;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function SRCMemberProfileDialog({
  member,
  onClose,
}: SRCMemberProfileDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = "src-member-profile-title";
  const grade = member.grade === "N/A" ? "Not listed" : member.grade;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="src-profile-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="src-profile-dialog__surface">
        <button
          type="button"
          className="src-profile-dialog__close"
          onClick={onClose}
          aria-label="Close profile"
          autoFocus
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="src-profile-dialog__hero">
          <div className="src-profile-dialog__portrait">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={`${member.name}`} />
            ) : (
              <span aria-hidden="true">{getInitials(member.name)}</span>
            )}
          </div>

          <div className="src-profile-dialog__identity">
            <span className="src-profile-dialog__eyebrow">
              {member.category}
            </span>
            <h2 id={titleId}>{member.name}</h2>
            <p>{member.position}</p>
          </div>
        </div>

        <div className="src-profile-dialog__details">
          <div>
            <span>Role</span>
            <strong>{member.position}</strong>
          </div>
          <div>
            <span>Year group</span>
            <strong>{grade}</strong>
          </div>
          <div>
            <span>Leadership area</span>
            <strong>{member.category}</strong>
          </div>
        </div>

        {member.bio && (
          <p className="src-profile-dialog__bio">{member.bio}</p>
        )}

        <div className="src-profile-dialog__footer">
          <span>WSR Student Representative Council</span>
        </div>
      </div>
    </dialog>
  );
}
