import tempfile
import unittest
from pathlib import Path

from tone_manager import server


class LibraryRenameTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.original_db_path = server.DB_PATH
        server.DB_PATH = Path(self.tmp.name) / "tone_manager.sqlite3"
        server.init_db()

    def tearDown(self):
        server.DB_PATH = self.original_db_path
        self.tmp.cleanup()

    def test_rename_library_recipe_updates_index_and_recipe_payload(self):
        saved = server.save_recipe_to_library(
            {
                "name": "Old recipe",
                "recipe_type": "coffeeAdvanced",
                "slot": 1,
                "volume_ml": 250,
                "points": [],
            }
        )

        renamed = server.rename_library_recipe(saved["id"], "  Daily washed 250  ")
        listed = server.list_library()[0]

        self.assertEqual(renamed["name"], "Daily washed 250")
        self.assertEqual(renamed["recipe"]["name"], "Daily washed 250")
        self.assertEqual(listed["name"], "Daily washed 250")
        self.assertEqual(listed["recipe"]["name"], "Daily washed 250")


if __name__ == "__main__":
    unittest.main()
