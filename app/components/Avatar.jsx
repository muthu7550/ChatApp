export function ChatAvatar({ conversation, currentUser, size = 44 }) {
  if (conversation?.type === "group") {
    if (
      conversation?.avatar &&
      !conversation.avatar.includes("ui-avatars.com")
    ) {
      return (
        <img
          src={conversation.avatar}
          className="rounded-circle object-fit-cover"
          width={size}
          height={size}
          alt="group"
        />
      );
    }

    return (
      <div
        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)",
          fontSize: size * 0.38,
        }}
      >
        {(conversation?.name || "G")
          .substring(0, 2)
          .toUpperCase()}
      </div>
    );
  }

  const receiver = conversation?.members?.find(
    (member) => member?._id !== currentUser?._id
  );

  if (receiver?.avatar) {
    return (
      <img
        src={receiver.avatar}
        className="rounded-circle object-fit-cover"
        width={size}
        height={size}
        alt={receiver?.name}
      />
    );
  }

  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg,#ff9d2e,#ff5b2f)",
        fontSize: size * 0.38,
      }}
    >
      {(receiver?.name || "U")
        .substring(0, 2)
        .toUpperCase()}
    </div>
  );
}