import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from tone_manager import server


class LibraryWriteTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.original_db_path = server.DB_PATH
        server.DB_PATH = Path(self.tmp.name) / "tone_manager.sqlite3"
        server.init_db()

    def tearDown(self):
        server.DB_PATH = self.original_db_path
        self.tmp.cleanup()

    def test_write_library_recipe_to_slot_uses_copy_without_mutating_saved_recipe(self):
        saved = server.save_recipe_to_library(
            {
                "name": "Saved 250",
                "recipe_type": "coffeeAdvanced",
                "slot": 2,
                "number": 2,
                "volume_ml": 250,
                "points": [{"index": 0, "duration_s": 10, "flow_ml_s": 4}],
            }
        )

        with patch.object(server, "write_recipe_slot", return_value={"slot": 0, "status": "verified"}) as write_recipe_slot:
            result = server.write_library_recipe_to_slot(saved["id"], 0, "WRITE SLOT 1", 123)

        write_recipe_slot.assert_called_once()
        slot, recipe, confirmation, before_backup_id = write_recipe_slot.call_args.args
        self.assertEqual(slot, 0)
        self.assertEqual(recipe["slot"], 0)
        self.assertEqual(recipe["number"], 0)
        self.assertEqual(recipe["name"], "Saved 250")
        self.assertEqual(confirmation, "WRITE SLOT 1")
        self.assertEqual(before_backup_id, 123)
        self.assertEqual(result["slot"], 0)

        listed = server.list_library()[0]
        self.assertEqual(listed["origin_slot"], 2)
        self.assertEqual(listed["recipe"]["slot"], 2)
        self.assertEqual(listed["recipe"]["number"], 2)


if __name__ == "__main__":
    unittest.main()
