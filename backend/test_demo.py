import httpx
import pytest

from backend.app import app
from backend.normalization import normalize_description


def test_normalization_preserves_lines_and_removes_scripts():
    assert (
        normalize_description(
            "&lt;p&gt;Python &amp;amp; SQL&lt;/p&gt;<script>alert(1)</script><p>Remote</p>"
        )
        == "Python & SQL\n\nRemote"
    )


@pytest.mark.asyncio
async def test_archive_restore_and_persistence(tmp_path, monkeypatch):
    monkeypatch.setenv("DEMO_DB_PATH", str(tmp_path / "test.db"))
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        items = (await client.get("/api/vacancies")).json()
        assert len(items) == 3
        assert {item["analysis"]["conclusion"] for item in items} == {
            "strong_fit",
            "weak_fit",
            "worth_considering",
        }
        await client.patch("/api/vacancies/1/status", json={"status": "applied"})
        await client.patch("/api/vacancies/1/status", json={"status": "archived"})
        restored = await client.patch("/api/vacancies/1/status", json={"status": "restore"})
        assert restored.json()["status"] == "applied"
        assert (
            next(item for item in (await client.get("/api/vacancies")).json() if item["id"] == 1)[
                "status"
            ]
            == "applied"
        )
        assert (
            await client.patch("/api/vacancies/999/status", json={"status": "new"})
        ).status_code == 404
        assert (
            await client.patch("/api/vacancies/1/status", json={"status": "invalid"})
        ).status_code == 422
        assert (await client.post("/api/normalize", json={"text": "<p>Python</p>"})).json() == {
            "text": "Python"
        }
