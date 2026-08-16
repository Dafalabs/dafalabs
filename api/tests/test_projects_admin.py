PNG_VERISI = b"\x89PNG\r\n\x1a\n" + b"0" * 32

ADMIN = {"email": "admin@dafalabs.com", "password": "yoneticiParola1"}
MUSTERI = {"email": "musteri@example.com", "password": "cokGizliParola1"}

YENI = {
    "slug": "yeni-proje",
    "title_tr": "Yeni Proje",
    "tagline_tr": "Panelden eklenen proje.",
    "title_en": "New Project",
    "tagline_en": "Added from the panel.",
    "url": "https://ornek.com",
    "image_url": "/media/ornek.png",
    "tags": ["Flutter", "Web"],
    "sort_order": 5,
    "is_published": True,
}


def test_oturumsuz_proje_listesi_kapali(client):
    assert client.get("/admin/projects").status_code == 401


def test_musteri_proje_ekleyemiyor(client, user):
    client.post("/auth/login", json=MUSTERI)
    assert client.post("/admin/projects", json=YENI).status_code == 403


def test_proje_ekleniyor_ve_sitede_gorunuyor(client, admin):
    client.post("/auth/login", json=ADMIN)

    yanit = client.post("/admin/projects", json=YENI)
    assert yanit.status_code == 201
    assert yanit.json()["slug"] == "yeni-proje"

    site = client.get("/site").json()["projects"]
    assert [p["id"] for p in site] == ["yeni-proje"]
    assert site[0]["image_url"] == "/media/ornek.png"


def test_ayni_slug_reddediliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/projects", json=YENI)
    assert client.post("/admin/projects", json=YENI).status_code == 409


def test_gecersiz_slug_reddediliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    assert client.post("/admin/projects", json={**YENI, "slug": "Büyük Harf"}).status_code == 422


def test_proje_guncelleniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    pid = client.post("/admin/projects", json=YENI).json()["id"]

    yanit = client.patch(f"/admin/projects/{pid}", json={**YENI, "title_tr": "Güncellendi"})
    assert yanit.status_code == 200
    assert yanit.json()["title_tr"] == "Güncellendi"


def test_yayindan_kaldirilan_proje_sitede_yok(client, admin):
    client.post("/auth/login", json=ADMIN)
    pid = client.post("/admin/projects", json=YENI).json()["id"]

    client.patch(f"/admin/projects/{pid}", json={**YENI, "is_published": False})
    assert client.get("/site").json()["projects"] == []


def test_proje_siliniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    pid = client.post("/admin/projects", json=YENI).json()["id"]

    assert client.delete(f"/admin/projects/{pid}").status_code == 204
    assert client.get("/admin/projects").json() == []


def test_gorsel_yukleniyor(client, admin, tmp_path, monkeypatch):
    from app.services import media as media_service

    monkeypatch.setattr(media_service, "MEDIA_DIR", tmp_path)
    client.post("/auth/login", json=ADMIN)

    yanit = client.post(
        "/admin/upload",
        files={"file": ("Ekran Görüntüsü.PNG", PNG_VERISI, "image/png")},
    )

    assert yanit.status_code == 200
    yol = yanit.json()["image_url"]
    assert yol.startswith("/media/ekran-goruntusu-")
    assert (tmp_path / yol.split("/")[-1]).read_bytes() == PNG_VERISI


def test_desteklenmeyen_dosya_reddediliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    yanit = client.post("/admin/upload", files={"file": ("betik.sh", b"#!/bin/sh", "text/plain")})
    assert yanit.status_code == 422


def test_musteri_gorsel_yukleyemiyor(client, user):
    client.post("/auth/login", json=MUSTERI)
    yanit = client.post("/admin/upload", files={"file": ("a.png", PNG_VERISI, "image/png")})
    assert yanit.status_code == 403


def test_svg_artik_kabul_edilmiyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    yanit = client.post(
        "/admin/upload",
        files={"file": ("logo.svg", b"<svg onload=alert(1)></svg>", "image/svg+xml")},
    )
    assert yanit.status_code == 422


def test_uzantisi_dogru_ama_icerigi_sahte_dosya_reddediliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    yanit = client.post(
        "/admin/upload",
        files={"file": ("zararli.png", b"<?php echo 1; ?>", "image/png")},
    )
    assert yanit.status_code == 422
