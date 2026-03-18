import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Salon } from "./salon.entity";

@Entity("availability")
@Unique(["salonId", "date"])
export class Availability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "salon_id", type: "uuid" })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: "CASCADE" })
  @JoinColumn({ name: "salon_id" })
  salon: Salon;

  @Column({ type: "date" })
  date: string;

  @Column({ name: "start_time", type: "time", default: "09:00" })
  startTime: string;

  @Column({ name: "end_time", type: "time", default: "19:00" })
  endTime: string;

  @Column({ name: "is_closed", type: "boolean", default: false })
  isClosed: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
