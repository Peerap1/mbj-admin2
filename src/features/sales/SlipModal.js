import React from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import ActionIcon from "../../components/ActionIcon";
import { SlipContent } from "../../components/SlipContent";
import { printSale } from "./printSale";

export default function SlipModal({ sale, createdBy, onClose }) {
  if (!sale) return null;
  return (
    <Modal
      title={sale.status === "paid" ? "ใบเสร็จ" : "ใบส่งของ"}
      onClose={onClose}
      maxWidth={780}
      bodyStyle={{ padding: "4px 24px 24px", maxHeight: "80vh", overflowY: "auto" }}
      headerActions={
        <Button size="sm" onClick={() => printSale(sale, createdBy)}>
          <ActionIcon name="document" size={15} />
          พิมพ์ / PDF
        </Button>
      }
    >
      <SlipContent sale={sale} createdBy={createdBy} />
    </Modal>
  );
}
