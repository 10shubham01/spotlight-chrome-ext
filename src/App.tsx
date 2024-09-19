import React, { useState, useEffect } from "react";

const COMMANDS: { name: string; action: () => void }[] = [
  { name: "New Tab", action: () => chrome.tabs.create({}) },
  { name: "New Window", action: () => chrome.windows.create({}) },
  {
    name: "Open History Page",
    action: () => chrome.tabs.create({ url: "chrome://history" }),
  },
  {
    name: "Open Downloads",
    action: () => chrome.tabs.create({ url: "chrome://downloads" }),
  },
  {
    name: "Open Extensions",
    action: () => chrome.tabs.create({ url: "chrome://extensions" }),
  },
  {
    name: "Open Bookmarks",
    action: () => chrome.tabs.create({ url: "chrome://bookmarks" }),
  },
  {
    name: "Add this tab to Bookmarks",
    action: () =>
      chrome.bookmarks.create({
        title: document.title,
        url: window.location.href,
      }),
  },
  {
    name: "Open Settings",
    action: () => chrome.tabs.create({ url: "chrome://settings" }),
  },
  // { name: "Close Current Tab", action: () => chrome.tabs.remove(null) },
  { name: "Reload Tab", action: () => chrome.tabs.reload() },
  // { name: "Duplicate Tab", action: () => chrome.tabs.duplicate(null) },
  {
    name: "New Incognito Window",
    action: () => chrome.windows.create({ incognito: true }),
  },
  // Add other command actions...
];

const CommandPalette: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [filteredCommands, setFilteredCommands] =
    useState<typeof COMMANDS>(COMMANDS);

  useEffect(() => {
    setFilteredCommands(
      COMMANDS.filter((command) =>
        command.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query]);

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        padding: "16px",
        width: "384px",
        margin: "auto",
        borderRadius: "8px",
      }}
    >
      <input
        type="text"
        style={{
          width: "100%",
          padding: "8px",
          color: "#fff",
          backgroundColor: "#333",
          borderRadius: "4px",
        }}
        placeholder="Type a command or search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul style={{ marginTop: "16px", listStyleType: "none", padding: 0 }}>
        {filteredCommands.map((command, idx) => (
          <li
            key={idx}
            style={{ padding: "8px", color: "#fff", cursor: "pointer" }}
            onClick={command.action}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#444")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            {command.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommandPalette;
